"""Modèles de champs définis par l'utilisateur (sans IA).

Un modèle décrit, en YAML, les champs à extraire d'un type de document. Chaque
champ fournit une liste de motifs regex : le premier qui correspond remplit le
champ. Un modèle peut cibler certains documents via `match` (mots-clés qui
doivent apparaître dans le texte).

Exemple (templates/facture.yaml) :

    name: facture
    match: ["facture", "invoice"]
    fields:
      numero_facture:
        patterns:
          - "facture\\s*(?:n[°o]|#)\\s*[:.]?\\s*([A-Z0-9\\-/]+)"
      total:
        patterns:
          - "total\\s*(?:ttc)?\\s*[:.]?\\s*([0-9 .,]+)\\s*€"
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml


@dataclass
class FieldSpec:
    name: str
    patterns: list[str]
    flags: int = re.IGNORECASE


@dataclass
class Template:
    name: str
    fields: list[FieldSpec] = field(default_factory=list)
    match: list[str] = field(default_factory=list)  # mots-clés d'activation

    def applies_to(self, text: str) -> bool:
        """Le modèle s'applique si aucun mot-clé n'est requis, ou si l'un match."""
        if not self.match:
            return True
        low = text.lower()
        return any(kw.lower() in low for kw in self.match)

    def extract(self, text: str) -> list[dict[str, Any]]:
        """Renvoie [{template, field, value}] pour les champs trouvés."""
        results: list[dict[str, Any]] = []
        for spec in self.fields:
            value = self._first_match(text, spec)
            if value is not None:
                results.append(
                    {"template": self.name, "field": spec.name, "value": value}
                )
        return results

    @staticmethod
    def _first_match(text: str, spec: FieldSpec) -> str | None:
        for pat in spec.patterns:
            try:
                m = re.search(pat, text, spec.flags)
            except re.error:
                continue
            if m:
                # Le groupe 1 s'il existe, sinon la correspondance entière.
                value = m.group(1) if m.groups() else m.group(0)
                return value.strip()
        return None


def load_templates(templates_dir: str | Path) -> list[Template]:
    """Charge tous les modèles *.yaml d'un dossier. Dossier absent -> liste vide."""
    directory = Path(templates_dir)
    if not directory.exists():
        return []

    templates: list[Template] = []
    for path in sorted(directory.glob("*.yaml")):
        try:
            with open(path, "r", encoding="utf-8") as fh:
                data = yaml.safe_load(fh) or {}
        except yaml.YAMLError:
            continue

        name = data.get("name") or path.stem
        raw_fields = data.get("fields") or {}
        specs: list[FieldSpec] = []
        for fname, fdef in raw_fields.items():
            if isinstance(fdef, dict):
                patterns = fdef.get("patterns") or []
            elif isinstance(fdef, list):
                patterns = fdef
            else:
                patterns = [str(fdef)]
            specs.append(FieldSpec(name=fname, patterns=[str(p) for p in patterns]))

        templates.append(
            Template(name=name, fields=specs, match=list(data.get("match") or []))
        )
    return templates


def apply_templates(text: str, templates: list[Template]) -> list[dict[str, Any]]:
    """Applique tous les modèles pertinents au texte et agrège les champs."""
    out: list[dict[str, Any]] = []
    for tpl in templates:
        if tpl.applies_to(text):
            out.extend(tpl.extract(text))
    return out
