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

# Statuts possibles d'un fichier dans la file d'attente.
STATUS_PENDING = "pending"
STATUS_PROCESSING = "processing"
STATUS_DONE = "done"
STATUS_ERROR = "error"

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

CREATE TABLE IF NOT EXISTS jobs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    path          TEXT NOT NULL UNIQUE,      -- chemin du fichier source
    hash          TEXT,                      -- hash du contenu (une fois lu)
    status        TEXT NOT NULL DEFAULT 'pending',
    attempts      INTEGER NOT NULL DEFAULT 0,
    error         TEXT,
    updated_at    REAL
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
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
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()

    # ------------------------------------------------------------------ #
    # File d'attente / reprise sur incident
    # ------------------------------------------------------------------ #
    def enqueue(self, path: str) -> None:
        """Ajoute un fichier à la file s'il n'y est pas déjà."""
        self.conn.execute(
            "INSERT OR IGNORE INTO jobs(path, status, updated_at) VALUES (?, ?, ?)",
            (path, STATUS_PENDING, time.time()),
        )
        self.conn.commit()

    def recover_stuck_jobs(self) -> int:
        """Au démarrage : les jobs restés 'processing' (crash) repassent 'pending'.

        Retourne le nombre de jobs récupérés.
        """
        cur = self.conn.execute(
            "UPDATE jobs SET status=?, updated_at=? WHERE status=?",
            (STATUS_PENDING, time.time(), STATUS_PROCESSING),
        )
        self.conn.commit()
        return cur.rowcount

    def next_pending(self, max_retries: int) -> sqlite3.Row | None:
        """Réserve le prochain job à traiter (le passe en 'processing').

        Ne prend que les 'pending' et les 'error' sous le plafond de tentatives.
        Opération atomique : évite qu'un même fichier soit pris deux fois.
        """
        row = self.conn.execute(
            """
            SELECT * FROM jobs
            WHERE status = ? OR (status = ? AND attempts < ?)
            ORDER BY id LIMIT 1
            """,
            (STATUS_PENDING, STATUS_ERROR, max_retries),
        ).fetchone()
        if row is None:
            return None
        self.conn.execute(
            "UPDATE jobs SET status=?, updated_at=? WHERE id=?",
            (STATUS_PROCESSING, time.time(), row["id"]),
        )
        self.conn.commit()
        return row

    def mark_done(self, job_id: int, file_hash: str) -> None:
        self.conn.execute(
            "UPDATE jobs SET status=?, hash=?, error=NULL, updated_at=? WHERE id=?",
            (STATUS_DONE, file_hash, time.time(), job_id),
        )
        self.conn.commit()

    def mark_error(self, job_id: int, message: str) -> None:
        self.conn.execute(
            "UPDATE jobs SET status=?, attempts=attempts+1, error=?, updated_at=? WHERE id=?",
            (STATUS_ERROR, message, time.time(), job_id),
        )
        self.conn.commit()

    def job_counts(self) -> dict[str, int]:
        rows = self.conn.execute(
            "SELECT status, COUNT(*) AS n FROM jobs GROUP BY status"
        ).fetchall()
        return {r["status"]: r["n"] for r in rows}

    # ------------------------------------------------------------------ #
    # Consignation des documents (transactionnelle)
    # ------------------------------------------------------------------ #
    def document_exists(self, file_hash: str) -> bool:
        row = self.conn.execute(
            "SELECT 1 FROM documents WHERE hash=? LIMIT 1", (file_hash,)
        ).fetchone()
        return row is not None

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
