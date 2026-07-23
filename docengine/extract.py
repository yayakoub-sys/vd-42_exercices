"""Extraction du contenu selon le type de fichier.

Assemble des moteurs open-source existants — on ne réimplémente aucun parseur :
  - PDF texte ........ PyMuPDF (fitz)
  - PDF scanné ....... OCR Tesseract via ocrmypdf (fallback si le PDF n'a pas de texte)
  - Images ........... OCR Tesseract via pytesseract
  - Word ............. python-docx
  - Excel ............ openpyxl
  - CSV / texte ...... bibliothèque standard

Chaque extracteur renvoie un ExtractResult : le texte intégral, une structure
optionnelle (titres, tableaux…) et le nom de la méthode utilisée.
"""

from __future__ import annotations

import csv
import hashlib
import io
import os
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# Seuil : en dessous de ce nombre de caractères, un PDF est considéré « sans
# texte » (scanné) et bascule vers l'OCR.
MIN_PDF_TEXT_CHARS = 16

# Découpage : nombre de pages traitées par lot (mémoire constante sur gros PDF).
DEFAULT_BATCH_PAGES = 5

# Garde-fou mémoire pour les très gros fichiers texte (octets lus au maximum).
DEFAULT_MAX_TEXT_BYTES = 50 * 1024 * 1024  # 50 Mo


@dataclass
class ExtractResult:
    text: str = ""
    structure: dict[str, Any] = field(default_factory=dict)
    method: str = "none"
    truncated: bool = False   # True si un garde-fou mémoire a limité la lecture
    pages: int = 0


class ExtractionError(Exception):
    """Erreur récupérable pendant l'extraction (fichier illisible, OCR absent…)."""


# --------------------------------------------------------------------------- #
# Utilitaires
# --------------------------------------------------------------------------- #
def file_hash(path: str | Path, chunk_size: int = 1 << 20) -> str:
    """SHA-256 du contenu du fichier (identité stable, pour l'idempotence)."""
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(chunk_size), b""):
            h.update(chunk)
    return h.hexdigest()


def guess_mime(ext: str) -> str:
    return {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".tiff": "image/tiff",
        ".tif": "image/tiff",
        ".bmp": "image/bmp",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".csv": "text/csv",
        ".txt": "text/plain",
        ".md": "text/markdown",
    }.get(ext.lower(), "application/octet-stream")


# --------------------------------------------------------------------------- #
# Extracteurs par type
# --------------------------------------------------------------------------- #
def _extract_txt(path: Path, max_bytes: int = DEFAULT_MAX_TEXT_BYTES) -> ExtractResult:
    """Texte lu par blocs, avec garde-fou mémoire (jamais tout charger si énorme)."""
    chunks: list[str] = []
    read = 0
    truncated = False
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        while True:
            block = fh.read(1 << 20)  # 1 Mo à la fois
            if not block:
                break
            chunks.append(block)
            read += len(block.encode("utf-8", errors="ignore"))
            if read >= max_bytes:
                truncated = True
                break
    return ExtractResult(text="".join(chunks), method="text", truncated=truncated)


def _extract_pdf(path: Path, ocr_langs: str, batch_pages: int = DEFAULT_BATCH_PAGES) -> ExtractResult:
    """PDF : texte natif via PyMuPDF (page par page) ; bascule OCR si scanné.

    Le traitement est **par lots de pages** : à tout instant une seule page est en
    mémoire, ce qui garde la machine légère même sur un rapport de 500 pages.
    """
    try:
        import fitz  # PyMuPDF
    except ImportError as exc:  # pragma: no cover
        raise ExtractionError("PyMuPDF (fitz) n'est pas installé") from exc

    parts: list[str] = []
    titles: list[str] = []
    n_pages = 0
    with fitz.open(path) as doc:
        n_pages = doc.page_count
        for page in doc:  # itération paresseuse, une page à la fois
            parts.append(page.get_text("text"))
        for _lvl, title, _page in doc.get_toc() or []:
            titles.append(title)
    text = "\n".join(parts).strip()

    if len(text) >= MIN_PDF_TEXT_CHARS:
        return ExtractResult(
            text=text, method="pdf-text", pages=n_pages,
            structure={"titres": titles} if titles else {},
        )

    # Peu ou pas de texte -> PDF scanné : OCR page par page, par lots.
    return _ocr_pdf_batched(path, ocr_langs, batch_pages)


def _ocr_pdf_batched(path: Path, ocr_langs: str, batch_pages: int) -> ExtractResult:
    """OCR d'un PDF scanné page par page (rendu + Tesseract), mémoire constante.

    Chaque page est rendue en image, océrisée, puis libérée avant la suivante :
    aucun gros fichier n'encombre la mémoire. Traité par lots de `batch_pages`.
    """
    try:
        import fitz
        import pytesseract
        from PIL import Image
    except ImportError as exc:  # pragma: no cover
        raise ExtractionError(
            "OCR indisponible : installez PyMuPDF + pytesseract + Pillow + Tesseract."
        ) from exc

    texts: list[str] = []
    with fitz.open(path) as doc:
        n_pages = doc.page_count
        for start in range(0, n_pages, batch_pages):
            for i in range(start, min(start + batch_pages, n_pages)):
                page = doc.load_page(i)
                pix = page.get_pixmap(dpi=200)
                try:
                    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                    texts.append(pytesseract.image_to_string(img, lang=ocr_langs))
                finally:
                    pix = None  # libère la page rendue avant la suivante
    return ExtractResult(text="\n".join(texts).strip(), method="pdf-ocr", pages=n_pages)


def _extract_image(path: Path, ocr_langs: str) -> ExtractResult:
    """OCR d'une image (jpg, png, tiff…) via pytesseract."""
    try:
        import pytesseract
        from PIL import Image
    except ImportError as exc:  # pragma: no cover
        raise ExtractionError(
            "OCR image indisponible : installez pytesseract + Pillow + Tesseract."
        ) from exc

    try:
        with Image.open(path) as img:
            text = pytesseract.image_to_string(img, lang=ocr_langs)
    except Exception as exc:
        raise ExtractionError(f"Échec OCR de l'image : {exc}") from exc
    return ExtractResult(text=text.strip(), method="image-ocr")


def _extract_docx(path: Path) -> ExtractResult:
    try:
        import docx  # python-docx
    except ImportError as exc:  # pragma: no cover
        raise ExtractionError("python-docx n'est pas installé") from exc

    document = docx.Document(str(path))
    paragraphs: list[str] = []
    titles: list[str] = []
    for p in document.paragraphs:
        if p.text.strip():
            paragraphs.append(p.text)
            if p.style and p.style.name and p.style.name.lower().startswith("heading"):
                titles.append(p.text)

    tables: list[list[list[str]]] = []
    for table in document.tables:
        rows = [[cell.text for cell in row.cells] for row in table.rows]
        tables.append(rows)
        for row in rows:
            paragraphs.append("\t".join(row))

    text = "\n".join(paragraphs).strip()
    structure: dict[str, Any] = {}
    if titles:
        structure["titres"] = titles
    if tables:
        structure["tableaux"] = tables
    return ExtractResult(text=text, structure=structure, method="docx")


def _extract_xlsx(path: Path) -> ExtractResult:
    try:
        import openpyxl
    except ImportError as exc:  # pragma: no cover
        raise ExtractionError("openpyxl n'est pas installé") from exc

    wb = openpyxl.load_workbook(str(path), read_only=True, data_only=True)
    lines: list[str] = []
    tables: dict[str, list[list[str]]] = {}
    for ws in wb.worksheets:
        sheet_rows: list[list[str]] = []
        lines.append(f"# Feuille : {ws.title}")
        for row in ws.iter_rows(values_only=True):
            cells = ["" if c is None else str(c) for c in row]
            if any(cells):
                sheet_rows.append(cells)
                lines.append("\t".join(cells))
        tables[ws.title] = sheet_rows
    wb.close()
    return ExtractResult(
        text="\n".join(lines).strip(),
        structure={"feuilles": tables},
        method="xlsx",
    )


def _extract_csv(path: Path) -> ExtractResult:
    raw = path.read_text(encoding="utf-8", errors="replace")
    # Détection du séparateur (virgule, point-virgule, tabulation…).
    try:
        dialect = csv.Sniffer().sniff(raw[:4096], delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel
    rows = list(csv.reader(io.StringIO(raw), dialect))
    lines = ["\t".join(r) for r in rows]
    return ExtractResult(
        text="\n".join(lines).strip(),
        structure={"lignes": rows},
        method="csv",
    )


# --------------------------------------------------------------------------- #
# Point d'entrée
# --------------------------------------------------------------------------- #
def extract(
    path: str | Path,
    ocr_langs: str = "fra+eng",
    *,
    batch_pages: int = DEFAULT_BATCH_PAGES,
    max_text_bytes: int = DEFAULT_MAX_TEXT_BYTES,
) -> ExtractResult:
    """Extrait le contenu d'un fichier en routant selon son extension.

    `batch_pages` contrôle le découpage des PDF (OCR page par page) ;
    `max_text_bytes` borne la lecture des très gros fichiers texte.
    """
    path = Path(path)
    ext = path.suffix.lower()

    if ext in (".txt", ".md"):
        return _extract_txt(path, max_bytes=max_text_bytes)
    if ext == ".pdf":
        return _extract_pdf(path, ocr_langs, batch_pages=batch_pages)
    if ext in (".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".gif", ".webp"):
        return _extract_image(path, ocr_langs)
    if ext == ".docx":
        return _extract_docx(path)
    if ext == ".xlsx":
        return _extract_xlsx(path)
    if ext in (".csv", ".tsv"):
        return _extract_csv(path)

    raise ExtractionError(f"Type de fichier non pris en charge : {ext}")
