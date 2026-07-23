"""Tests de la garantie de finitude : triage, états terminaux, cascade, couverture."""

import sys
import threading
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from docengine import triage as triage_mod  # noqa: E402
from docengine.config import Config  # noqa: E402
from docengine.store import Store  # noqa: E402
from docengine.worker import Worker  # noqa: E402

SAMPLE = Path(__file__).resolve().parent.parent / "sample" / "facture_demo.txt"


# --------------------------------------------------------------------------- #
# Triage
# --------------------------------------------------------------------------- #
def test_triage_readable():
    assert triage_mod.triage("/x/rapport.pdf").readable is True
    assert triage_mod.triage("/x/note.txt").kind == "readable"


def test_triage_noise_and_technical():
    assert triage_mod.triage("/x/.DS_Store").kind == "noise"
    assert triage_mod.triage("/x/a/node_modules/lib/index.js").kind == "technical"
    assert triage_mod.triage("/x/empty.txt", size=0).kind == "noise"


def test_triage_video_and_raw():
    assert triage_mod.triage("/x/film.mp4").kind == "video"
    assert triage_mod.triage("/x/photo.CR2").kind == "raw_photo"
    assert triage_mod.triage("/x/film.mp4").readable is False


def test_triage_unknown_is_catalogued_not_lost():
    r = triage_mod.triage("/x/mystere.xyz")
    assert r.kind == "unknown"
    assert r.readable is False   # recensé, jamais traité en profondeur ni perdu


# --------------------------------------------------------------------------- #
# États terminaux & couverture
# --------------------------------------------------------------------------- #
def _worker(tmp_path):
    cfg = Config(db_path=str(tmp_path / "f.db"),
                 templates_dir=str(Path(__file__).resolve().parent.parent / "templates"))
    store = Store(cfg.db_file)
    return cfg, store, Worker(cfg, store, threading.Lock())


def test_readable_reaches_done(tmp_path):
    cfg, store, w = _worker(tmp_path)
    store.enqueue(str(SAMPLE))
    assert w.run_once() is True
    assert store.job_counts().get("done") == 1
    store.close()


def test_noise_is_classified_not_dropped(tmp_path):
    cfg, store, w = _worker(tmp_path)
    noise = tmp_path / ".DS_Store"
    noise.write_text("x")
    store.enqueue(str(noise))
    w.run_once()
    counts = store.job_counts()
    assert counts.get("classified") == 1
    assert counts.get("done", 0) == 0
    store.close()


def test_missing_file_is_marked_missing(tmp_path):
    cfg, store, w = _worker(tmp_path)
    store.enqueue(str(tmp_path / "jamais.txt"))  # n'existe pas
    w.run_once()
    assert store.job_counts().get("missing") == 1
    store.close()


def test_unreadable_document_goes_to_resolve(tmp_path):
    """Un .pdf illisible (contenu bidon) épuise la cascade -> to_resolve, pas perdu."""
    cfg, store, w = _worker(tmp_path)
    fake = tmp_path / "casse.pdf"
    fake.write_bytes(b"ceci n'est pas un vrai PDF")
    store.enqueue(str(fake))
    w.run_once()
    counts = store.job_counts()
    assert counts.get("to_resolve") == 1
    # motif présent = jamais un abandon silencieux
    reasons = store.reasons_breakdown("to_resolve")
    assert reasons and reasons[0]["reason"]
    store.close()


def test_reconciliation_total_equals_sum(tmp_path):
    """Cœur de la finitude : total = somme des états terminaux, 0 invisible."""
    cfg, store, w = _worker(tmp_path)
    store.enqueue(str(SAMPLE))                       # -> done
    noise = tmp_path / ".DS_Store"; noise.write_text("x")
    store.enqueue(str(noise))                        # -> classified
    store.enqueue(str(tmp_path / "absent.txt"))      # -> missing
    while w.run_once():
        pass
    recon = store.reconciliation()
    assert recon["total"] == 3
    assert recon["accounted"] == 3          # tous dans un état terminal
    assert recon["in_flight"] == 0
    assert recon["covered"] is True
    assert recon["coverage_pct"] == 100.0
    store.close()


def test_requeue_to_resolve_is_replayable(tmp_path):
    """La file 'à résoudre' n'est pas un cimetière : elle est rejouable."""
    cfg, store, w = _worker(tmp_path)
    fake = tmp_path / "casse.pdf"
    fake.write_bytes(b"pas un pdf")
    store.enqueue(str(fake))
    w.run_once()
    assert store.job_counts().get("to_resolve") == 1
    n = store.requeue_to_resolve(max_attempts=3)
    assert n == 1
    assert store.job_counts().get("pending") == 1
    store.close()
