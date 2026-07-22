"""Moteur local d'extraction et de consignation de documents (sans IA).

Assemble des briques open-source matures (Tesseract, PyMuPDF, python-docx,
openpyxl) pour lire des documents un par un depuis un volume défini, en
extraire le contenu, le qualifier par des règles, et le consigner dans une
base SQLite interrogeable — le tout 100 % en local, sans IA.
"""

__version__ = "0.1.0"
