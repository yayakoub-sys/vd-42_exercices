"""Chargement et validation de la configuration (config.yaml)."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

import yaml

# Racine du projet (dossier parent de docengine/).
PROJECT_ROOT = Path(__file__).resolve().parent.parent

DEFAULT_EXTENSIONS = [
    ".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp",
    ".docx", ".xlsx", ".csv", ".txt", ".md",
]


@dataclass
class Config:
    """Paramètres du moteur, chargés depuis config.yaml."""

    watch_path: str = ""
    expected_volume_label: str = ""
    ocr_langs: list[str] = field(default_factory=lambda: ["fra", "eng"])
    poll_on_start: bool = True
    extensions: list[str] = field(default_factory=lambda: list(DEFAULT_EXTENSIONS))
    max_retries: int = 3
    db_path: str = "data/docs.db"
    templates_dir: str = "templates"
    host: str = "127.0.0.1"
    port: int = 8000

    @property
    def db_file(self) -> Path:
        """Chemin absolu de la base SQLite."""
        p = Path(self.db_path)
        return p if p.is_absolute() else PROJECT_ROOT / p

    @property
    def templates_path(self) -> Path:
        """Chemin absolu du dossier des modèles de champs."""
        p = Path(self.templates_dir)
        return p if p.is_absolute() else PROJECT_ROOT / p

    @property
    def ocr_lang_arg(self) -> str:
        """Langues OCR au format Tesseract, ex. 'fra+eng'."""
        return "+".join(self.ocr_langs) if self.ocr_langs else "eng"

    def normalized_extensions(self) -> set[str]:
        """Extensions en minuscules, avec le point de tête garanti."""
        out = set()
        for ext in self.extensions:
            ext = ext.lower().strip()
            if ext and not ext.startswith("."):
                ext = "." + ext
            if ext:
                out.add(ext)
        return out


def _default_config_file() -> Path:
    return PROJECT_ROOT / "config.yaml"


def load_config(path: str | os.PathLike[str] | None = None) -> Config:
    """Charge config.yaml. À défaut, retombe sur config.example.yaml.

    Lève FileNotFoundError si aucun fichier n'est trouvé.
    """
    if path is not None:
        cfg_file = Path(path)
    else:
        cfg_file = _default_config_file()
        if not cfg_file.exists():
            example = PROJECT_ROOT / "config.example.yaml"
            if example.exists():
                cfg_file = example

    if not cfg_file.exists():
        raise FileNotFoundError(
            f"Fichier de configuration introuvable : {cfg_file}. "
            "Copiez config.example.yaml en config.yaml."
        )

    with open(cfg_file, "r", encoding="utf-8") as fh:
        raw = yaml.safe_load(fh) or {}

    known = {f.name for f in Config.__dataclass_fields__.values()}
    filtered = {k: v for k, v in raw.items() if k in known}
    return Config(**filtered)
