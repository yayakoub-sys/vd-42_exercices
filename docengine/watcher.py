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


def _depth_of(root: Path, path: Path) -> int:
    try:
        return len(path.relative_to(root).parts) - 1
    except ValueError:
        return len(path.parts) - 1


def _enqueue_with_meta(store: Store, lock: threading.Lock, root: Path, path: Path) -> None:
    """Enfile un fichier avec ses métadonnées (taille, profondeur, date)."""
    try:
        st = path.stat()
        size, mtime = st.st_size, st.st_mtime
    except OSError:
        size, mtime = None, None
    with lock:
        store.enqueue(str(path), size=size, depth=_depth_of(root, path), mtime=mtime)


def scan_existing(config: Config, store: Store, lock: threading.Lock) -> int:
    """Enfile TOUS les fichiers présents sur le volume (le triage tranchera ensuite).

    On enfile tout — même ce qu'on ne sait pas lire — pour garantir la couverture :
    chaque fichier du disque aura une ligne dans le registre. Renvoie le nombre
    enfilé. Ignore les dossiers inaccessibles (permissions) sans planter.
    """
    root = Path(config.watch_path)
    if not root.exists():
        return 0

    count = 0
    for path in root.rglob("*"):
        try:
            if path.is_file():
                _enqueue_with_meta(store, lock, root, path)
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
        self.root = Path(config.watch_path)

    def _maybe_enqueue(self, path_str: str) -> None:
        path = Path(path_str)
        try:
            if path.is_file():   # tout fichier : le triage classera ensuite
                _enqueue_with_meta(self.store, self.lock, self.root, path)
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
