"""Worker : traite les fichiers de la file un par un, avec reprise sur incident.

Pipeline pour chaque fichier :
    lire -> hash -> extraire -> qualifier (détecteurs + modèles) -> consigner

Robustesse (« reprendre quand c'est cassé ») :
- Le worker ne prend qu'un job à la fois et le marque 'processing' de façon atomique.
- La consignation est transactionnelle : un fichier n'est 'done' qu'une fois tout
  écrit en base. Un crash laisse le job en 'processing' ; au prochain démarrage,
  Store.recover_stuck_jobs() le remet en 'pending'.
- Un fichier déjà consigné (même hash) n'est pas retraité.
- Un fichier en erreur est réessayé jusqu'à max_retries.
"""

from __future__ import annotations

import threading
import time
from pathlib import Path

from .config import Config
from . import detectors, extract
from .store import Store
from .templates import Template, apply_templates, load_templates


class Worker:
    def __init__(self, config: Config, store: Store, lock: threading.Lock | None = None):
        self.config = config
        self.store = store
        self.lock = lock or threading.Lock()
        self.templates: list[Template] = load_templates(config.templates_path)
        self._stop = threading.Event()

    # ------------------------------------------------------------------ #
    def process_file(self, path: str) -> int:
        """Traite un seul fichier et le consigne. Renvoie l'id du document.

        Lève une exception en cas d'échec (le worker la capte et marque l'erreur).
        """
        p = Path(path)
        if not p.exists():
            raise extract.ExtractionError(f"Fichier introuvable : {path}")

        file_hash = extract.file_hash(p)

        # Idempotence : déjà consigné avec ce contenu -> rien à refaire.
        if self.store.document_exists(file_hash):
            return -1

        result = extract.extract(p, ocr_langs=self.config.ocr_lang_arg)

        entities = detectors.detect_all(result.text)
        fields = apply_templates(result.text, self.templates)

        doc_id = self.store.save_document(
            file_hash=file_hash,
            path=str(p),
            name=p.name,
            ext=p.suffix.lower(),
            mime=extract.guess_mime(p.suffix),
            size=p.stat().st_size,
            method=result.method,
            text=result.text,
            structure=result.structure or None,
            entities=entities,
            fields=fields,
        )
        return doc_id

    # ------------------------------------------------------------------ #
    def run_once(self) -> bool:
        """Traite au plus un job. Renvoie True si un job a été traité."""
        with self.lock:
            job = self.store.next_pending(self.config.max_retries)
        if job is None:
            return False

        job_id, path = job["id"], job["path"]
        try:
            self.process_file(path)
            file_hash = extract.file_hash(path) if Path(path).exists() else ""
            with self.lock:
                self.store.mark_done(job_id, file_hash)
        except Exception as exc:  # échec récupérable : on réessaiera
            with self.lock:
                self.store.mark_error(job_id, f"{type(exc).__name__}: {exc}")
            return True
        return True

    def run_forever(self, idle_sleep: float = 1.0) -> None:
        """Boucle principale : vide la file, puis attend de nouveaux fichiers."""
        while not self._stop.is_set():
            worked = self.run_once()
            if not worked:
                # File vide : petite pause avant de re-sonder.
                self._stop.wait(idle_sleep)

    def stop(self) -> None:
        self._stop.set()
