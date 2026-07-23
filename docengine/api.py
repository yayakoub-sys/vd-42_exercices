"""API web locale (FastAPI) : consultation, recherche et export.

Sert aussi l'interface statique (dossier web/). Tout est exposé sur localhost
uniquement — aucune donnée ne sort de la machine.
"""

from __future__ import annotations

import csv
import io
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from .config import Config, load_config
from .store import Store

WEB_DIR = Path(__file__).resolve().parent.parent / "web"


def create_app(config: Config | None = None, store: Store | None = None) -> FastAPI:
    config = config or load_config()
    store = store or Store(config.db_file)

    app = FastAPI(title="Moteur d'extraction de documents", version="0.1.0")

    @app.get("/api/status")
    def status() -> dict:
        recon = store.reconciliation()
        return {
            "watch_path": config.watch_path,
            "jobs": recon["counts"],
            "reconciliation": recon,
            "documents": len(store.list_documents(limit=1_000_000)),
        }

    @app.get("/api/reconciliation")
    def reconciliation() -> dict:
        """Rapport de couverture : total = somme des états, % couvert, 0 invisible."""
        recon = store.reconciliation()
        recon["reasons_to_resolve"] = store.reasons_breakdown("to_resolve")
        recon["reasons_classified"] = store.reasons_breakdown("classified")
        return recon

    @app.get("/api/registry")
    def registry(status_: str = Query("to_resolve", alias="status"), limit: int = 200) -> list[dict]:
        """Liste les fichiers d'un état donné (ex. à résoudre) — jamais invisibles."""
        return store.list_by_status(status_, limit=limit)

    @app.post("/api/requeue")
    def requeue() -> dict:
        """Rejoue les fichiers 'à résoudre' (sous le plafond de tentatives)."""
        n = store.requeue_to_resolve(max(config.max_retries, 1))
        return {"requeued": n}

    @app.get("/api/documents")
    def documents(limit: int = 100, offset: int = 0) -> list[dict]:
        return store.list_documents(limit=limit, offset=offset)

    @app.get("/api/documents/{doc_id}")
    def document(doc_id: int) -> dict:
        doc = store.get_document(doc_id)
        if doc is None:
            raise HTTPException(status_code=404, detail="Document introuvable")
        return doc

    @app.get("/api/search")
    def search(q: str = Query(..., min_length=1), limit: int = 50) -> list[dict]:
        # FTS5 : on échappe les guillemets pour une requête littérale sûre.
        safe = q.replace('"', '""')
        try:
            return store.search(f'"{safe}"', limit=limit)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Recherche invalide : {exc}")

    @app.get("/api/entities/{type_}")
    def entities(type_: str, limit: int = 200) -> list[dict]:
        return store.find_entities(type_, limit=limit)

    @app.get("/api/documents/{doc_id}/export.json")
    def export_json(doc_id: int) -> Response:
        doc = store.get_document(doc_id)
        if doc is None:
            raise HTTPException(status_code=404, detail="Document introuvable")
        payload = json.dumps(doc, ensure_ascii=False, indent=2)
        return Response(
            content=payload, media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="doc-{doc_id}.json"'},
        )

    @app.get("/api/documents/{doc_id}/export.csv")
    def export_csv(doc_id: int) -> Response:
        doc = store.get_document(doc_id)
        if doc is None:
            raise HTTPException(status_code=404, detail="Document introuvable")
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["categorie", "type_ou_champ", "valeur", "brut", "position"])
        for e in doc.get("entites", []):
            writer.writerow(["entite", e["type"], e["value"], e["raw"], e["position"]])
        for f in doc.get("champs", []):
            writer.writerow(["champ", f"{f['template']}.{f['field']}", f["value"], "", ""])
        return Response(
            content=buf.getvalue(), media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="doc-{doc_id}.csv"'},
        )

    # Interface web statique (montée en dernier pour ne pas masquer /api).
    if WEB_DIR.exists():
        app.mount("/", StaticFiles(directory=str(WEB_DIR), html=True), name="web")
    else:  # pragma: no cover
        @app.get("/", response_class=HTMLResponse)
        def index() -> str:
            return "<h1>Moteur d'extraction</h1><p>UI absente (dossier web/).</p>"

    return app
