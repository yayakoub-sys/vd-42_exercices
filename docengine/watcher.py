"""Watcher : découvre les documents sur le volume et alimente la file d'attente.

Deux modes complémentaires :
1. Balayage initial (poll_on_start) : parcourt tout le volume au démarrage et
   enfile chaque fichier éligible (les doublons sont ignorés par la file).
2. Surveillance continue (watchdog) : enfile automatiquement tout nouveau fichier
   déposé sur le volume pendant que le moteur tourne.

Le watcher se contente d'enfiler ; c'est le worker qui traite un par un.
"""

from __future__ import annotations

import threading
from pathlib import Path

from .config import Config
from .store import Store


def _is_eligible(path: Path, extensions: set[str]) -> bool:
    return path.is_file() and path.suffix.lower() in extensions


def scan_existing(config: Config, store: Store, lock: threading.Lock) -> int:
    """Enfile tous les fichiers éligibles déjà présents sur le volume.

    Renvoie le nombre de fichiers enfilés. Ignore silencieusement les dossiers
    inaccessibles (permissions).
    """
    root = Path(config.watch_path)
    if not root.exists():
        return 0

    extensions = config.normalized_extensions()
    count = 0
    for path in root.rglob("*"):
        try:
            if _is_eligible(path, extensions):
                with lock:
                    store.enqueue(str(path))
                count += 1
        except (PermissionError, OSError):
            continue
    return count


def verify_volume(config: Config) -> tuple[bool, str]:
    """Vérifie que le volume surveillé est présent (et porte le bon libellé).

    Sur Windows, le libellé du volume n'est pas dans le chemin ; on se contente
    de vérifier l'existence du lecteur. Renvoie (ok, message).
    """
    root = Path(config.watch_path)
    if not config.watch_path:
        return False, "watch_path n'est pas renseigné dans config.yaml."
    if not root.exists():
        return False, f"Le volume/dossier surveillé est introuvable : {config.watch_path}"
    return True, f"Volume surveillé : {config.watch_path}"


class _EnqueueHandler:
    """Handler watchdog : enfile les fichiers créés/déplacés/modifiés."""

    def __init__(self, config: Config, store: Store, lock: threading.Lock):
        self.config = config
        self.store = store
        self.lock = lock
        self.extensions = config.normalized_extensions()

    def _maybe_enqueue(self, path_str: str) -> None:
        path = Path(path_str)
        try:
            if _is_eligible(path, self.extensions):
                with self.lock:
                    self.store.enqueue(str(path))
        except (PermissionError, OSError):
            pass

    # Signatures attendues par watchdog.
    def dispatch(self, event) -> None:  # noqa: ANN001 (type watchdog)
        if getattr(event, "is_directory", False):
            return
        # Nouveau fichier ou fichier déplacé/renommé -> on tente d'enfiler.
        dest = getattr(event, "dest_path", "") or getattr(event, "src_path", "")
        if dest:
            self._maybe_enqueue(dest)


def start_watching(config: Config, store: Store, lock: threading.Lock):
    """Démarre la surveillance temps réel. Renvoie l'observer (ou None si watchdog
    est indisponible / le volume est absent)."""
    ok, _ = verify_volume(config)
    if not ok:
        return None
    try:
        from watchdog.observers import Observer
    except ImportError:
        return None

    handler = _EnqueueHandler(config, store, lock)
    observer = Observer()
    observer.schedule(handler, config.watch_path, recursive=True)
    observer.daemon = True
    observer.start()
    return observer
