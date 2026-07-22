"""Point d'entrée : `python -m docengine`.

Démarre l'ensemble du moteur :
  1. Charge la configuration et ouvre la base SQLite.
  2. Reprise sur incident : remet en file les jobs restés 'processing'.
  3. Balaye le volume existant (si poll_on_start) et lance la surveillance temps réel.
  4. Lance le worker (traitement un par un) dans un thread.
  5. Sert l'interface web locale (FastAPI/uvicorn).

Usage :
    python -m docengine                # tout : traitement + interface web
    python -m docengine --no-web       # traitement seul (sans interface)
    python -m docengine --scan-only    # balaye et traite l'existant puis s'arrête
"""

from __future__ import annotations

import argparse
import sys
import threading

from .config import load_config
from .store import Store
from .watcher import scan_existing, start_watching, verify_volume
from .worker import Worker


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="docengine", description=__doc__)
    parser.add_argument("--config", help="Chemin d'un config.yaml alternatif")
    parser.add_argument("--no-web", action="store_true", help="Ne pas lancer l'interface web")
    parser.add_argument("--scan-only", action="store_true",
                        help="Traiter l'existant puis s'arrêter (pas de surveillance)")
    args = parser.parse_args(argv)

    config = load_config(args.config)
    store = Store(config.db_file)
    lock = threading.Lock()

    # 2. Reprise sur incident.
    recovered = store.recover_stuck_jobs()
    if recovered:
        print(f"[reprise] {recovered} fichier(s) interrompu(s) remis en file.")

    # Vérification du volume.
    ok, msg = verify_volume(config)
    print(f"[volume] {msg}")

    worker = Worker(config, store, lock)

    # --scan-only : balaye, vide la file, s'arrête.
    if args.scan_only:
        if ok:
            n = scan_existing(config, store, lock)
            print(f"[scan] {n} fichier(s) enfilé(s).")
        while worker.run_once():
            pass
        print(f"[terminé] {store.job_counts()}")
        return 0

    # 3. Balayage initial + surveillance continue.
    observer = None
    if ok:
        if config.poll_on_start:
            n = scan_existing(config, store, lock)
            print(f"[scan] {n} fichier(s) existant(s) enfilé(s).")
        observer = start_watching(config, store, lock)
        if observer:
            print("[surveillance] nouveaux fichiers détectés automatiquement.")
        else:
            print("[surveillance] indisponible (watchdog absent ou volume inaccessible).")
    else:
        print("[attention] volume absent : le moteur démarre quand même, "
              "il traitera dès que le disque sera monté et re-scanné.")

    # 4. Worker en tâche de fond.
    worker_thread = threading.Thread(target=worker.run_forever, daemon=True)
    worker_thread.start()

    # 5. Interface web (bloquant) ou boucle simple.
    if args.no_web:
        print("[prêt] traitement en cours. Ctrl+C pour quitter.")
        try:
            worker_thread.join()
        except KeyboardInterrupt:
            pass
    else:
        import uvicorn
        from .api import create_app

        app = create_app(config, store)
        print(f"[web] interface : http://{config.host}:{config.port}")
        try:
            uvicorn.run(app, host=config.host, port=config.port, log_level="warning")
        except KeyboardInterrupt:
            pass

    worker.stop()
    if observer:
        observer.stop()
    print("\n[arrêt] moteur stoppé proprement.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
