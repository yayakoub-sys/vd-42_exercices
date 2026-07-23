"""Worker : traite les fichiers un par un avec GARANTIE DE FINITUDE.

Chaque fichier atteint **un** état terminal explicite, jamais un abandon silencieux :

  découvert → trié → [cascade d'extraction → audit] → DONE
  découvert → trié → CLASSIFIED   (bruit/technique/vidéo/RAW : catalogué, compté)
  fichier absent → MISSING
  échec après TOUTE la cascade → TO_RESOLVE (motif, rejouable — pas un cimetière)

Méthodologies reprises :
- **Triage à l'entrée** : on ne dépense de l'énergie que sur les fichiers lisibles.
- **Cascade de résolution (fallbacks)** : l'échec n'est que le dernier recours.
- **Quality gate / Write-Audit-Publish** : un fichier n'est DONE qu'après audit du
  résultat (texte attendu non vide).
- **Reprise** : consignation transactionnelle ; un crash laisse le job en
  'processing', récupéré au démarrage suivant.
"""

from __future__ import annotations

import threading
from pathlib import Path

from .config import Config
from . import detectors, extract, triage as triage_mod
from .store import Store
from .templates import Template, apply_templates, load_templates

# Extensions image : l'audit y est plus souple (texte OCR facultatif).
_IMAGE_EXTS = triage_mod.READABLE_IMAGE_EXT


class Worker:
    def __init__(self, config: Config, store: Store, lock: threading.Lock | None = None):
        self.config = config
        self.store = store
        self.lock = lock or threading.Lock()
        self.templates: list[Template] = load_templates(config.templates_path)
        self._stop = threading.Event()

    # ------------------------------------------------------------------ #
    # Cascade de résolution : stratégies essayées dans l'ordre.
    # ------------------------------------------------------------------ #
    def _strategies(self, path: Path, ext: str):
        """Génère (nom_étape, fonction) — la 1re qui passe l'audit gagne."""
        langs = self.config.ocr_lang_arg

        def standard() -> extract.ExtractResult:
            return extract.extract(
                path, ocr_langs=langs,
                batch_pages=self.config.batch_pages,
                max_text_bytes=self.config.max_text_bytes,
            )
        yield ("standard", standard)

        # Repli Tika (universel) si activé — utile quand le lecteur natif échoue.
        if self.config.enable_tika:
            def tika() -> extract.ExtractResult:
                return _extract_tika(path, self.config.tika_server)
            yield ("tika", tika)

        # Dernier repli PDF : forcer l'OCR page par page même si un peu de texte.
        if ext == ".pdf":
            def force_ocr() -> extract.ExtractResult:
                return extract._ocr_pdf_batched(path, langs, self.config.batch_pages)
            yield ("pdf-force-ocr", force_ocr)

    @staticmethod
    def _passes_gate(ext: str, result: extract.ExtractResult) -> bool:
        """Audit mécanique (quality gate). Pour une image, le texte OCR est facultatif
        (on catalogue quand même) ; pour un document, le texte doit être non vide."""
        if ext in _IMAGE_EXTS:
            return True
        return bool(result.text and result.text.strip())

    # ------------------------------------------------------------------ #
    def _persist(self, p: Path, file_hash: str, result: extract.ExtractResult) -> None:
        entities = detectors.detect_all(result.text) if result.text else []
        fields = apply_templates(result.text, self.templates) if result.text else []
        structure = dict(result.structure or {})
        if result.truncated:
            structure["_tronque"] = True   # trace d'audit : lecture bornée
        self.store.save_document(
            file_hash=file_hash,
            path=str(p),
            name=p.name,
            ext=p.suffix.lower(),
            mime=extract.guess_mime(p.suffix),
            size=p.stat().st_size,
            method=result.method,
            text=result.text,
            structure=structure or None,
            entities=entities,
            fields=fields,
        )

    def _process_job(self, job_id: int, path: str) -> None:
        """Traite un fichier jusqu'à un état terminal. Ne lève pas : tout est capté."""
        p = Path(path)

        # 1. Le fichier a-t-il disparu (disque vivant) ?
        if not p.exists():
            self.store.mark_missing(job_id)
            return

        try:
            size = p.stat().st_size
        except OSError:
            self.store.mark_missing(job_id)
            return

        # 2. Triage : ne dépenser de l'énergie que sur les fichiers lisibles.
        tri = triage_mod.triage(path, size)
        if not tri.readable:
            self.store.mark_classified(job_id, tri.kind, tri.reason)
            return

        # 3. Idempotence : déjà consigné avec ce contenu.
        try:
            file_hash = extract.file_hash(p)
        except OSError:
            self.store.mark_missing(job_id)
            return
        if self.store.document_exists(file_hash):
            self.store.mark_done(job_id, file_hash, kind=tri.kind, stage="cache")
            return

        # 4. Cascade de résolution + audit.
        ext = p.suffix.lower()
        last_stage = ""
        last_error = ""
        for stage_name, fn in self._strategies(p, ext):
            last_stage = stage_name
            try:
                result = fn()
            except extract.ExtractionError as exc:
                last_error = str(exc)
                continue
            except Exception as exc:  # une stratégie ne doit pas tuer le worker
                last_error = f"{type(exc).__name__}: {exc}"
                continue
            if self._passes_gate(ext, result):
                self._persist(p, file_hash, result)
                self.store.mark_done(job_id, file_hash, kind=tri.kind, stage=stage_name)
                return
            last_error = "audit : texte attendu mais vide"

        # 5. Toute la cascade a échoué -> à résoudre (rejouable, jamais perdu).
        reason = "extraction impossible après cascade complète"
        self.store.mark_to_resolve(job_id, reason, stage=last_stage, message=last_error)

    # ------------------------------------------------------------------ #
    def process_file(self, path: str) -> int:
        """Traite un fichier lisible et le consigne (chemin direct, pour tests/API).

        Renvoie l'id du document, ou -1 si déjà présent. Lève en cas d'échec.
        """
        p = Path(path)
        if not p.exists():
            raise extract.ExtractionError(f"Fichier introuvable : {path}")
        file_hash = extract.file_hash(p)
        if self.store.document_exists(file_hash):
            return -1
        result = extract.extract(
            p, ocr_langs=self.config.ocr_lang_arg,
            batch_pages=self.config.batch_pages,
            max_text_bytes=self.config.max_text_bytes,
        )
        self._persist(p, file_hash, result)
        doc = self.store.get_document_id_by_hash(file_hash)
        return doc if doc is not None else -1

    def run_once(self) -> bool:
        """Traite au plus un fichier. Renvoie True si un fichier a été traité."""
        with self.lock:
            job = self.store.next_pending(self.config.max_retries)
        if job is None:
            return False
        with self.lock:
            self._process_job(job["id"], job["path"])
        return True

    def run_forever(self, idle_sleep: float = 1.0, requeue_every: float = 60.0) -> None:
        """Boucle : vide la file, rejoue périodiquement les 'to_resolve', puis attend."""
        since_requeue = 0.0
        while not self._stop.is_set():
            worked = self.run_once()
            if not worked:
                # File vide : on tente de rejouer les échecs récupérables.
                with self.lock:
                    n = self.store.requeue_to_resolve(self.config.max_retries)
                if not n:
                    self._stop.wait(idle_sleep)
                    since_requeue += idle_sleep

    def stop(self) -> None:
        self._stop.set()


# --------------------------------------------------------------------------- #
# Repli universel : Apache Tika (optionnel, nécessite Java / un tika-server).
# --------------------------------------------------------------------------- #
def _extract_tika(path: Path, server_url: str = "") -> extract.ExtractResult:
    try:
        from tika import parser  # tika-python
    except ImportError as exc:  # pragma: no cover
        raise extract.ExtractionError("tika-python non installé (repli Tika désactivé)") from exc

    kwargs = {"serverEndpoint": server_url} if server_url else {}
    try:
        parsed = parser.from_file(str(path), **kwargs)
    except Exception as exc:
        raise extract.ExtractionError(f"Échec Tika : {exc}") from exc
    text = (parsed.get("content") or "").strip()
    meta = parsed.get("metadata") or {}
    return extract.ExtractResult(text=text, method="tika", structure={"tika_meta": meta})
