"""Qualification par règles (sans IA) : détection d'entités par motifs.

Chaque détecteur repère un type d'information dans le texte et renvoie une liste
d'entités : {type, value (normalisée), raw (texte brut), position}. Ainsi chaque
information est isolée et devient requêtable individuellement dans la base.
"""

from __future__ import annotations

import re
from typing import Any, Callable

# --------------------------------------------------------------------------- #
# Expressions régulières (motifs FR/EN courants)
# --------------------------------------------------------------------------- #
RE_EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")

RE_URL = re.compile(r"https?://[^\s<>\"')]+", re.IGNORECASE)

# Téléphone FR/international : +33 6 12 34 56 78, 06.12.34.56.78, 01 23 45 67 89…
RE_PHONE = re.compile(
    r"(?<!\d)(?:(?:\+|00)\d{1,3}[ .\-]?)?(?:\(?\d{1,4}\)?[ .\-]?){2,5}\d{2,4}(?!\d)"
)

# Date numérique : 22/07/2026, 22-07-2026, 2026-07-22, 22.07.26
RE_DATE_NUM = re.compile(
    r"\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b"
    r"|\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b"
)

# Date textuelle FR : 22 juillet 2026, 1er janvier 2025
_MOIS = (
    "janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|"
    "septembre|octobre|novembre|décembre|decembre"
)
RE_DATE_TXT = re.compile(
    rf"\b(\d{{1,2}})(?:er)?\s+({_MOIS})\s+(\d{{4}})\b", re.IGNORECASE
)

# Montant + devise : 1 200,00 €, €1200.00, 1,200.00 EUR, 45.90$
RE_MONTANT = re.compile(
    r"(?P<sym1>[€$£])?\s?"
    r"(?P<num>\d{1,3}(?:[ ., ]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)"
    r"\s?(?P<sym2>€|\$|£|EUR|USD|GBP|euros?|dollars?)?",
    re.IGNORECASE,
)

# IBAN (FR et international) : FR76 3000 6000 0112 3456 7890 189
RE_IBAN = re.compile(r"\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,3})?\b")

# SIRET (14 chiffres) et SIREN (9 chiffres)
RE_SIRET = re.compile(r"\b\d{3}[ ]?\d{3}[ ]?\d{3}[ ]?\d{5}\b")
RE_SIREN = re.compile(r"\b\d{3}[ ]?\d{3}[ ]?\d{3}\b")

# TVA intracommunautaire FR : FR + clé (2) + SIREN (9)
RE_TVA = re.compile(r"\bFR[ ]?[0-9A-Z]{2}[ ]?\d{3}[ ]?\d{3}[ ]?\d{3}\b")

# Code postal FR (5 chiffres) — filtré par contexte pour limiter le bruit.
RE_CP = re.compile(r"\b\d{5}\b")

_MONTHS_MAP = {
    "janvier": 1, "février": 2, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5,
    "juin": 6, "juillet": 7, "août": 8, "aout": 8, "septembre": 9,
    "octobre": 10, "novembre": 11, "décembre": 12, "decembre": 12,
}


# --------------------------------------------------------------------------- #
# Normalisation
# --------------------------------------------------------------------------- #
def _norm_date(y: int, m: int, d: int) -> str | None:
    if not (1 <= m <= 12 and 1 <= d <= 31):
        return None
    if y < 100:  # année sur 2 chiffres -> 20xx
        y += 2000
    return f"{y:04d}-{m:02d}-{d:02d}"


def _norm_amount(num: str) -> float | None:
    """Convertit '1 200,00' ou '1,200.00' en float. Renvoie None si ambigu."""
    s = num.replace(" ", "").replace(" ", "")
    if "," in s and "." in s:
        # Le dernier séparateur est le décimal.
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s:
        # Virgule décimale si suivie de 1-2 chiffres, sinon séparateur de milliers.
        if re.search(r",\d{1,2}$", s):
            s = s.replace(",", ".")
        else:
            s = s.replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None


def _entity(type_: str, value: Any, raw: str, position: int) -> dict[str, Any]:
    return {"type": type_, "value": str(value), "raw": raw, "position": position}


# --------------------------------------------------------------------------- #
# Détecteurs
# --------------------------------------------------------------------------- #
def detect_emails(text: str) -> list[dict[str, Any]]:
    return [_entity("email", m.group().lower(), m.group(), m.start())
            for m in RE_EMAIL.finditer(text)]


def detect_urls(text: str) -> list[dict[str, Any]]:
    return [_entity("url", m.group(), m.group(), m.start())
            for m in RE_URL.finditer(text)]


def detect_dates(text: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for m in RE_DATE_NUM.finditer(text):
        if m.group(1):  # jj/mm/aaaa
            d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        else:           # aaaa/mm/jj
            y, mo, d = int(m.group(4)), int(m.group(5)), int(m.group(6))
        norm = _norm_date(y, mo, d)
        if norm:
            out.append(_entity("date", norm, m.group(), m.start()))
    for m in RE_DATE_TXT.finditer(text):
        d = int(m.group(1))
        mo = _MONTHS_MAP.get(m.group(2).lower())
        y = int(m.group(3))
        norm = _norm_date(y, mo, d) if mo else None
        if norm:
            out.append(_entity("date", norm, m.group(), m.start()))
    return out


def detect_amounts(text: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for m in RE_MONTANT.finditer(text):
        sym = m.group("sym1") or m.group("sym2")
        if not sym:  # pas de devise -> trop ambigu, on ignore (évite le bruit)
            continue
        value = _norm_amount(m.group("num"))
        if value is None:
            continue
        devise = _currency_code(sym)
        ent = _entity("montant", value, m.group().strip(), m.start())
        ent["devise"] = devise
        out.append(ent)
    return out


def _currency_code(sym: str) -> str:
    s = sym.lower()
    if s in ("€", "eur", "euro", "euros"):
        return "EUR"
    if s in ("$", "usd", "dollar", "dollars"):
        return "USD"
    if s in ("£", "gbp"):
        return "GBP"
    return sym.upper()


def detect_phones(text: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for m in RE_PHONE.finditer(text):
        digits = re.sub(r"\D", "", m.group())
        if len(digits) < 9 or len(digits) > 15:  # écarte les faux positifs
            continue
        out.append(_entity("telephone", m.group().strip(), m.group(), m.start()))
    return out


def detect_iban(text: str) -> list[dict[str, Any]]:
    return [_entity("iban", re.sub(r"\s", "", m.group()), m.group(), m.start())
            for m in RE_IBAN.finditer(text)]


def detect_tva(text: str) -> list[dict[str, Any]]:
    return [_entity("tva", re.sub(r"\s", "", m.group()), m.group(), m.start())
            for m in RE_TVA.finditer(text)]


def detect_siret(text: str) -> list[dict[str, Any]]:
    return [_entity("siret", re.sub(r"\s", "", m.group()), m.group(), m.start())
            for m in RE_SIRET.finditer(text)]


# Tous les détecteurs actifs par défaut.
DETECTORS: list[Callable[[str], list[dict[str, Any]]]] = [
    detect_emails, detect_urls, detect_dates, detect_amounts,
    detect_phones, detect_iban, detect_tva, detect_siret,
]


def detect_all(text: str) -> list[dict[str, Any]]:
    """Applique tous les détecteurs et renvoie les entités dédupliquées."""
    entities: list[dict[str, Any]] = []
    for fn in DETECTORS:
        try:
            entities.extend(fn(text))
        except Exception:
            # Un détecteur défaillant ne doit jamais bloquer les autres.
            continue

    # Déduplication sur (type, value, position).
    seen: set[tuple] = set()
    unique: list[dict[str, Any]] = []
    for e in sorted(entities, key=lambda x: x["position"]):
        key = (e["type"], e["value"], e["position"])
        if key not in seen:
            seen.add(key)
            unique.append(e)
    return unique
