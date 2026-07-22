"""Tests des détecteurs et du pipeline de consignation (sans dépendances OCR)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from docengine import detectors  # noqa: E402
from docengine.store import Store  # noqa: E402
from docengine.templates import load_templates, apply_templates  # noqa: E402

SAMPLE = (Path(__file__).resolve().parent.parent / "sample" / "facture_demo.txt").read_text(
    encoding="utf-8"
)


def _values(entities, type_):
    return [e["value"] for e in entities if e["type"] == type_]


def test_detect_email():
    ents = detectors.detect_emails(SAMPLE)
    assert "contact@exemple.fr" in _values(ents, "email")


def test_detect_dates_normalized():
    ents = detectors.detect_dates(SAMPLE)
    dates = _values(ents, "date")
    assert "2026-07-22" in dates          # 22/07/2026
    assert "2026-08-21" in dates          # 21 août 2026 (date textuelle)


def test_detect_amounts_with_currency():
    ents = detectors.detect_amounts(SAMPLE)
    values = _values(ents, "montant")
    assert "1224.6" in values or "1224.60" in [f"{float(v):.2f}" for v in values]


def test_detect_iban():
    ents = detectors.detect_iban(SAMPLE)
    assert "FR7630006000011234567890189" in _values(ents, "iban")


def test_detect_all_dedup():
    ents = detectors.detect_all(SAMPLE)
    keys = [(e["type"], e["value"], e["position"]) for e in ents]
    assert len(keys) == len(set(keys))    # pas de doublon


def test_amount_normalization():
    assert detectors._norm_amount("1 200,00") == 1200.0
    assert detectors._norm_amount("1,200.00") == 1200.0
    assert detectors._norm_amount("45,90") == 45.90


def test_templates_facture():
    templates = load_templates(Path(__file__).resolve().parent.parent / "templates")
    fields = apply_templates(SAMPLE, templates)
    got = {f["field"]: f["value"] for f in fields}
    assert got.get("numero_facture") == "F-2026-0042"
    assert "1 224,60" in (got.get("total_ttc") or "") or "1224" in (got.get("total_ttc") or "")


def test_store_roundtrip(tmp_path):
    db = tmp_path / "test.db"
    store = Store(db)
    ents = detectors.detect_all(SAMPLE)
    doc_id = store.save_document(
        file_hash="abc123", path="/x/facture.txt", name="facture.txt",
        ext=".txt", mime="text/plain", size=len(SAMPLE), method="text",
        text=SAMPLE, structure=None, entities=ents, fields=[],
    )
    assert doc_id > 0
    # Recherche plein-texte.
    hits = store.search('"FACTURE"')
    assert any(h["id"] == doc_id for h in hits)
    # Idempotence : ré-enregistrer le même hash remplace, ne duplique pas.
    store.save_document(
        file_hash="abc123", path="/x/facture.txt", name="facture.txt",
        ext=".txt", mime="text/plain", size=len(SAMPLE), method="text",
        text=SAMPLE, structure=None, entities=ents, fields=[],
    )
    assert len(store.list_documents(limit=100)) == 1
    store.close()


def test_queue_recovery(tmp_path):
    """Un job resté 'processing' (crash) est récupéré au démarrage suivant."""
    db = tmp_path / "q.db"
    store = Store(db)
    store.enqueue("/vol/a.pdf")
    job = store.next_pending(max_retries=3)      # passe en 'processing'
    assert job is not None
    assert store.job_counts().get("processing") == 1
    # Simule un redémarrage.
    recovered = store.recover_stuck_jobs()
    assert recovered == 1
    assert store.job_counts().get("pending") == 1
    store.close()
