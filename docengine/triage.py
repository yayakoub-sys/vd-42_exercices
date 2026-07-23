"""Triage à l'entrée : classer chaque fichier vite et sans énergie gaspillée.

But : décider immédiatement, par des règles simples (pas de « cognitif »), si un
fichier mérite une extraction profonde ou s'il doit juste être **catalogué**.
Chaque fichier reçoit une classe et un motif ; rien n'est jeté en silence.

Classes :
- readable   : on tente l'extraction du contenu (documents, images utiles…).
- noise      : fichiers système/techniques sans valeur documentaire -> catalogués.
- technical  : artefacts de projet (code, dépendances, builds) -> catalogués.
- video      : vidéos -> cataloguées (pas de lecture de contenu, non urgent).
- raw_photo  : photos brutes d'appareil (RAW) -> cataloguées (non urgent).
- unknown    : type non reconnu -> catalogué (recensé, jamais perdu).
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path, PurePosixPath, PureWindowsPath

# --- Extensions par catégorie -------------------------------------------------
READABLE_DOC_EXT = {
    ".pdf", ".docx", ".doc", ".odt", ".rtf", ".txt", ".md",
    ".xlsx", ".xls", ".ods", ".csv", ".tsv",
    ".pptx", ".ppt", ".odp", ".html", ".htm", ".xml", ".json",
    ".eml", ".msg",
}
READABLE_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".gif", ".webp"}

VIDEO_EXT = {".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm", ".m4v", ".mpg", ".mpeg"}
RAW_PHOTO_EXT = {
    ".raw", ".cr2", ".cr3", ".nef", ".arw", ".dng", ".orf", ".rw2", ".raf", ".sr2", ".heic",
}
NOISE_EXT = {
    ".ds_store", ".thumbs", ".tmp", ".temp", ".bak", ".log", ".lock", ".swp", ".part",
    ".ini", ".cfg", ".plist", ".crdownload",
}
TECHNICAL_EXT = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".c", ".cpp", ".h", ".java", ".rb", ".go",
    ".rs", ".php", ".sh", ".bat", ".ps1", ".css", ".scss", ".map", ".class", ".o",
    ".pyc", ".so", ".dll", ".exe", ".bin", ".dylib", ".lib", ".a",
}

# Dossiers « techniques » à ignorer en profondeur (bruit de projets, souvent IA).
TECHNICAL_DIRS = {
    "node_modules", ".git", ".svn", "__pycache__", ".venv", "venv", "env",
    "dist", "build", ".next", ".cache", "vendor", ".idea", ".vscode",
    "site-packages", ".tox", "target", "bin", "obj", ".gradle", ".mvn",
}
NOISE_NAMES = {".ds_store", "thumbs.db", "desktop.ini", "$recycle.bin", ".localized"}


@dataclass
class TriageResult:
    kind: str          # readable | noise | technical | video | raw_photo | unknown
    reason: str
    readable: bool     # True si on doit tenter l'extraction du contenu


def _depth(path: str) -> int:
    """Profondeur d'imbrication (nombre de dossiers), tolérante Windows/Unix."""
    sep = "\\" if "\\" in path and "/" not in path.lstrip("\\/") else None
    parts = (PureWindowsPath(path) if sep else PurePosixPath(path.replace("\\", "/"))).parts
    return max(len(parts) - 1, 0)


def triage(path: str, size: int | None = None) -> TriageResult:
    """Classe un fichier à partir de son seul chemin (et taille si connue)."""
    p = Path(path)
    name = p.name.lower()
    ext = p.suffix.lower()
    parts_lower = {part.lower() for part in p.parts}

    # 1. Noms de bruit connus.
    if name in NOISE_NAMES or name.startswith("~$"):
        return TriageResult("noise", f"fichier système ({name})", False)

    # 2. Situé dans un dossier technique (dépendances, builds, .git…).
    if parts_lower & TECHNICAL_DIRS:
        hit = ", ".join(sorted(parts_lower & TECHNICAL_DIRS))
        return TriageResult("technical", f"dossier technique ({hit})", False)

    # 3. Fichier de taille nulle : rien à extraire.
    if size == 0:
        return TriageResult("noise", "fichier vide (0 octet)", False)

    # 4. Par extension.
    if ext in VIDEO_EXT:
        return TriageResult("video", "vidéo (catalogage seul)", False)
    if ext in RAW_PHOTO_EXT:
        return TriageResult("raw_photo", "photo brute RAW (catalogage seul)", False)
    if ext in NOISE_EXT:
        return TriageResult("noise", f"fichier technique/temporaire ({ext})", False)
    if ext in TECHNICAL_EXT:
        return TriageResult("technical", f"fichier de code/binaire ({ext})", False)
    if ext in READABLE_DOC_EXT or ext in READABLE_IMAGE_EXT:
        return TriageResult("readable", f"document lisible ({ext})", True)

    # 5. Inconnu : recensé, jamais perdu.
    return TriageResult("unknown", f"type non reconnu ({ext or 'sans extension'})", False)
