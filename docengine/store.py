"""Accès à la base SQLite : schéma, consignation des documents et suivi d'état.

Le stockage est volontairement « ultra léger » : un seul fichier SQLite, avec un
index plein-texte FTS5 pour retrouver instantanément n'importe quelle information.

Tables :
- documents : un enregistrement par fichier traité (texte intégral, métadonnées).
- entites   : chaque information qualifiée (date, montant, email…) isolée.
- champs     : valeurs des modèles de champs définis par l'utilisateur.
- documents_fts : index plein-texte (FTS5) sur le texte des documents.
- jobs       : file d'attente et suivi d'état pour la reprise sur incident.
"""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any, Iterable

# États du cycle de vie d'un fichier (garantie de finitude).
# Non terminaux : PENDING, PROCESSING.
# Terminaux     : DONE (traité + audité), CLASSIFIED (bruit/technique/vidéo/RAW,
#                 catalogué sans extraction profonde), TO_RESOLVE (échec après
#                 toute la cascade — rejouable, jamais un cimetière), MISSING
#                 (fichier disparu du disque pendant le traitement).
STATUS_PENDING = "pending"
STATUS_PROCESSING = "processing"
STATUS_DONE = "done"
STATUS_CLASSIFIED = "classified"
STATUS_TO_RESOLVE = "to_resolve"
STATUS_MISSING = "missing"

# Rétro-compat : ancien statut d'erreur, désormais synonyme de TO_RESOLVE.
STATUS_ERROR = STATUS_TO_RESOLVE

# Ensemble des états terminaux (pour la réconciliation).
TERMINAL_STATUSES = (STATUS_DONE, STATUS_CLASSIFIED, STATUS_TO_RESOLVE, STATUS_MISSING)

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    hash          TEXT NOT NULL UNIQUE,      -- SHA-256 du contenu (idempotence)
    path          TEXT NOT NULL,
    name          TEXT NOT NULL,
    ext           TEXT,
    mime          TEXT,
    size          INTEGER,
    method        TEXT,                      -- extracteur utilisé (pdf, ocr, docx…)
    text          TEXT,                      -- texte intégral extrait
    structure     TEXT,                      -- structure (JSON : titres, tableaux…)
    extracted_at  REAL
);

CREATE TABLE IF NOT EXISTS entites (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id   INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    type          TEXT NOT NULL,             -- date, montant, email, iban…
    value         TEXT,                      -- valeur normalisée
    raw           TEXT,                      -- texte brut d'origine
    position      INTEGER                    -- index caractère dans le texte
);
CREATE INDEX IF NOT EXISTS idx_entites_doc  ON entites(document_id);
CREATE INDEX IF NOT EXISTS idx_entites_type ON entites(type);

CREATE TABLE IF NOT EXISTS champs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id   INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    template      TEXT NOT NULL,             -- nom du modèle (ex. facture)
    field         TEXT NOT NULL,             -- nom du champ (ex. total)
    value         TEXT
);
CREATE INDEX IF NOT EXISTS idx_champs_doc ON champs(document_id);

CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
    name, text,
    content='documents', content_rowid='id',
    tokenize='unicode61'
);

-- Triggers pour garder l'index FTS synchronisé avec la table documents.
CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
    INSERT INTO documents_fts(rowid, name, text) VALUES (new.id, new.name, new.text);
END;
CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
    INSERT INTO documents_fts(documents_fts, rowid, name, text)
    VALUES ('delete', old.id, old.name, old.text);
END;
CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
    INSERT INTO documents_fts(documents_fts, rowid, name, text)
    VALUES ('delete', old.id, old.name, old.text);
    INSERT INTO documents_fts(rowid, name, text) VALUES (new.id, new.name, new.text);
END;

-- Registre maître : une ligne par fichier découvert, avec son état de finitude.
CREATE TABLE IF NOT EXISTS jobs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    path          TEXT NOT NULL UNIQUE,      -- chemin complet du fichier source
    hash          TEXT,                      -- SHA-256 du contenu (une fois lu)
    status        TEXT NOT NULL DEFAULT 'pending',
    kind          TEXT,                      -- classe de triage (readable, noise…)
    reason        TEXT,                      -- motif (classification ou échec)
    stage         TEXT,                      -- dernière étape de la cascade tentée
    size          INTEGER,                   -- taille en octets
    depth         INTEGER,                   -- profondeur d'imbrication (nb de dossiers)
    mtime         REAL,                      -- date de modification du fichier
    attempts      INTEGER NOT NULL DEFAULT 0,
    error         TEXT,
    updated_at    REAL
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_kind   ON jobs(kind);
"""


class Store:
    """Couche d'accès SQLite (thread-safe via un verrou côté worker/watcher)."""

    def __init__(self, db_path: str | Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        # check_same_thread=False : le watcher et le worker peuvent partager la
        # connexion, la sérialisation est assurée par les verrous appelants.
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL;")   # robustesse aux crashs
        self.conn.execute("PRAGMA foreign_keys=ON;")
        self.conn.executescript(SCHEMA)
        self._migrate()
        self.conn.commit()

    def _migrate(self) -> None:
        """Ajoute les colonnes manquantes sur une base plus ancienne (idempotent)."""
        existing = {row["name"] for row in self.conn.execute("PRAGMA table_info(jobs)")}
        for col, ddl in (
            ("kind", "TEXT"), ("reason", "TEXT"), ("stage", "TEXT"),
            ("size", "INTEGER"), ("depth", "INTEGER"), ("mtime", "REAL"),
        ):
            if col not in existing:
                self.conn.execute(f"ALTER TABLE jobs ADD COLUMN {col} {ddl}")

    def close(self) -> None:
        self.conn.close()

    # ------------------------------------------------------------------ #
    # File d'attente / reprise sur incident
    # ------------------------------------------------------------------ #
    def enqueue(self, path: str, *, size: int | None = None,
                depth: int | None = None, mtime: float | None = None) -> None:
        """Ajoute un fichier au registre s'il n'y est pas déjà (avec ses métadonnées)."""
        self.conn.execute(
            "INSERT OR IGNORE INTO jobs(path, status, size, depth, mtime, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (path, STATUS_PENDING, size, depth, mtime, time.time()),
        )
        self.conn.commit()

    def recover_stuck_jobs(self) -> int:
        """Au démarrage : les jobs restés 'processing' (crash) repassent 'pending'.

        Garantie de reprise : aucun fichier ne reste coincé « en cours » après un
        plantage. Retourne le nombre de jobs récupérés.
        """
        cur = self.conn.execute(
            "UPDATE jobs SET status=?, updated_at=? WHERE status=?",
            (STATUS_PENDING, time.time(), STATUS_PROCESSING),
        )
        self.conn.commit()
        return cur.rowcount

    def next_pending(self, max_retries: int = 0) -> sqlite3.Row | None:
        """Réserve atomiquement le prochain fichier à traiter (passe en 'processing').

        Ne prend que les 'pending' (le rejeu des 'to_resolve' se fait via
        requeue_to_resolve). max_retries est accepté pour compatibilité.
        """
        row = self.conn.execute(
            "SELECT * FROM jobs WHERE status = ? ORDER BY id LIMIT 1",
            (STATUS_PENDING,),
        ).fetchone()
        if row is None:
            return None
        self.conn.execute(
            "UPDATE jobs SET status=?, updated_at=? WHERE id=?",
            (STATUS_PROCESSING, time.time(), row["id"]),
        )
        self.conn.commit()
        return row

    def mark_done(self, job_id: int, file_hash: str, *,
                  kind: str | None = None, stage: str | None = None) -> None:
        """État terminal : fichier extrait ET audité avec succès."""
        self.conn.execute(
            "UPDATE jobs SET status=?, hash=?, kind=COALESCE(?, kind), stage=?, "
            "reason=NULL, error=NULL, updated_at=? WHERE id=?",
            (STATUS_DONE, file_hash, kind, stage, time.time(), job_id),
        )
        self.conn.commit()

    def mark_classified(self, job_id: int, kind: str, reason: str,
                        file_hash: str | None = None) -> None:
        """État terminal : catalogué sans extraction profonde (bruit, vidéo, RAW…).

        Le fichier reste COMPTÉ et recensé — jamais jeté en silence.
        """
        self.conn.execute(
            "UPDATE jobs SET status=?, kind=?, reason=?, hash=COALESCE(?, hash), "
            "error=NULL, updated_at=? WHERE id=?",
            (STATUS_CLASSIFIED, kind, reason, file_hash, time.time(), job_id),
        )
        self.conn.commit()

    def mark_to_resolve(self, job_id: int, reason: str, *,
                        stage: str | None = None, message: str | None = None) -> None:
        """État terminal (rejouable) : échec après toute la cascade. NE disparaît pas.

        C'est une liste de travail avec motif, pas un cimetière : requeue_to_resolve
        la ré-injecte pour un nouvel essai.
        """
        self.conn.execute(
            "UPDATE jobs SET status=?, reason=?, stage=?, error=?, "
            "attempts=attempts+1, updated_at=? WHERE id=?",
            (STATUS_TO_RESOLVE, reason, stage, message, time.time(), job_id),
        )
        self.conn.commit()

    def mark_missing(self, job_id: int) -> None:
        """État terminal : le fichier a disparu du disque pendant le traitement."""
        self.conn.execute(
            "UPDATE jobs SET status=?, reason='fichier disparu', updated_at=? WHERE id=?",
            (STATUS_MISSING, time.time(), job_id),
        )
        self.conn.commit()

    def requeue_to_resolve(self, max_attempts: int) -> int:
        """Rejoue les fichiers 'to_resolve' sous le plafond de tentatives -> 'pending'.

        Appelé périodiquement et au démarrage : la file d'échecs se vide d'elle-même
        au fil des corrections. Retourne le nombre de fichiers réinjectés.
        """
        cur = self.conn.execute(
            "UPDATE jobs SET status=?, updated_at=? WHERE status=? AND attempts < ?",
            (STATUS_PENDING, time.time(), STATUS_TO_RESOLVE, max_attempts),
        )
        self.conn.commit()
        return cur.rowcount

    def job_counts(self) -> dict[str, int]:
        rows = self.conn.execute(
            "SELECT status, COUNT(*) AS n FROM jobs GROUP BY status"
        ).fetchall()
        return {r["status"]: r["n"] for r in rows}

    def reconciliation(self) -> dict[str, Any]:
        """Rapport de couverture : total = somme des états. Garantit 0 fichier invisible.

        `accounted` = fichiers dans un état terminal ; `covered` True si tout le
        registre est terminal (plus rien en attente/en cours).
        """
        counts = self.job_counts()
        total = sum(counts.values())
        accounted = sum(counts.get(s, 0) for s in TERMINAL_STATUSES)
        in_flight = counts.get(STATUS_PENDING, 0) + counts.get(STATUS_PROCESSING, 0)
        return {
            "total": total,
            "counts": counts,
            "accounted": accounted,
            "in_flight": in_flight,
            "covered": total > 0 and in_flight == 0,
            "coverage_pct": round(100 * accounted / total, 2) if total else 0.0,
        }

    def reasons_breakdown(self, status: str = STATUS_TO_RESOLVE) -> list[dict[str, Any]]:
        """Répartition des motifs pour un état (ex. pourquoi des fichiers sont à résoudre)."""
        rows = self.conn.execute(
            "SELECT reason, COUNT(*) AS n FROM jobs WHERE status=? GROUP BY reason "
            "ORDER BY n DESC",
            (status,),
        ).fetchall()
        return [dict(r) for r in rows]

    def list_by_status(self, status: str, limit: int = 200) -> list[dict[str, Any]]:
        rows = self.conn.execute(
            "SELECT id, path, kind, reason, stage, size, attempts, error "
            "FROM jobs WHERE status=? ORDER BY id LIMIT ?",
            (status, limit),
        ).fetchall()
        return [dict(r) for r in rows]

    # ------------------------------------------------------------------ #
    # Consignation des documents (transactionnelle)
    # ------------------------------------------------------------------ #
    def document_exists(self, file_hash: str) -> bool:
        row = self.conn.execute(
            "SELECT 1 FROM documents WHERE hash=? LIMIT 1", (file_hash,)
        ).fetchone()
        return row is not None

    def get_document_id_by_hash(self, file_hash: str) -> int | None:
        row = self.conn.execute(
            "SELECT id FROM documents WHERE hash=? LIMIT 1", (file_hash,)
        ).fetchone()
        return row["id"] if row else None

    def save_document(
        self,
        *,
        file_hash: str,
        path: str,
        name: str,
        ext: str,
        mime: str,
        size: int,
        method: str,
        text: str,
        structure: dict[str, Any] | None,
        entities: Iterable[dict[str, Any]],
        fields: Iterable[dict[str, Any]],
    ) -> int:
        """Enregistre un document et ses annotations en une seule transaction.

        Idempotent : si le hash existe déjà, l'ancien document (et ses entités
        via ON DELETE CASCADE) est remplacé. Renvoie l'id du document.
        """
        with self.conn:  # transaction : tout ou rien
            self.conn.execute("DELETE FROM documents WHERE hash=?", (file_hash,))
            cur = self.conn.execute(
                """
                INSERT INTO documents
                    (hash, path, name, ext, mime, size, method, text, structure, extracted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    file_hash, path, name, ext, mime, size, method, text,
                    json.dumps(structure, ensure_ascii=False) if structure else None,
                    time.time(),
                ),
            )
            doc_id = cur.lastrowid
            for e in entities:
                self.conn.execute(
                    "INSERT INTO entites(document_id, type, value, raw, position) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (doc_id, e.get("type"), e.get("value"), e.get("raw"), e.get("position")),
                )
            for f in fields:
                self.conn.execute(
                    "INSERT INTO champs(document_id, template, field, value) "
                    "VALUES (?, ?, ?, ?)",
                    (doc_id, f.get("template"), f.get("field"), f.get("value")),
                )
        return doc_id

    # ------------------------------------------------------------------ #
    # Consultation / recherche (pour l'API)
    # ------------------------------------------------------------------ #
    def search(self, query: str, limit: int = 50) -> list[dict[str, Any]]:
        """Recherche plein-texte dans les documents (FTS5)."""
        rows = self.conn.execute(
            """
            SELECT d.id, d.name, d.path, d.ext, d.method, d.extracted_at,
                   snippet(documents_fts, 1, '[', ']', ' … ', 12) AS extrait
            FROM documents_fts
            JOIN documents d ON d.id = documents_fts.rowid
            WHERE documents_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (query, limit),
        ).fetchall()
        return [dict(r) for r in rows]

    def list_documents(self, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
        rows = self.conn.execute(
            "SELECT id, name, path, ext, method, size, extracted_at "
            "FROM documents ORDER BY extracted_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [dict(r) for r in rows]

    def get_document(self, doc_id: int) -> dict[str, Any] | None:
        row = self.conn.execute(
            "SELECT * FROM documents WHERE id=?", (doc_id,)
        ).fetchone()
        if row is None:
            return None
        doc = dict(row)
        if doc.get("structure"):
            try:
                doc["structure"] = json.loads(doc["structure"])
            except json.JSONDecodeError:
                pass
        doc["entites"] = [
            dict(r) for r in self.conn.execute(
                "SELECT type, value, raw, position FROM entites "
                "WHERE document_id=? ORDER BY position", (doc_id,)
            ).fetchall()
        ]
        doc["champs"] = [
            dict(r) for r in self.conn.execute(
                "SELECT template, field, value FROM champs WHERE document_id=?", (doc_id,)
            ).fetchall()
        ]
        return doc

    def find_entities(self, type_: str, limit: int = 200) -> list[dict[str, Any]]:
        rows = self.conn.execute(
            """
            SELECT e.type, e.value, e.raw, e.position, d.id AS document_id, d.name
            FROM entites e JOIN documents d ON d.id = e.document_id
            WHERE e.type = ? ORDER BY d.id LIMIT ?
            """,
            (type_, limit),
        ).fetchall()
        return [dict(r) for r in rows]
