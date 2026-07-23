# 📦 Passation complète du projet — de A à Z

> **À quoi sert ce fichier ?**
> C'est le **résumé complet** du projet, du tout début jusqu'à maintenant. Tu peux le garder,
> le déplacer où tu veux, et le **redonner à Claude dans une nouvelle session** (par exemple
> depuis ton dossier « yayakoub disque production kit »). Claude le lira et saura **tout
> reprendre** sans que tu aies à ré-expliquer.

---

## 🟢 POUR CLAUDE (nouvelle session) — lis ceci en premier

Tu reprends un projet déjà construit et testé. Règles de collaboration **obligatoires** :
- L'utilisateur **n'est pas technicien**. Parle avec des **mots simples**, jamais de jargon,
  **jamais de question technique** — c'est à toi de décider le « comment ».
- Structure tes réponses en : ✅ **ce que j'ai fait** · 🔜 **ce qui reste** · 🙋 **ce que
  j'attends de toi**.
- Avant toute proposition : **revue des angles morts + pré-mortem**.
- Rappel : **Claude fabrique le programme ; l'utilisateur le lance chez lui.** Claude ne voit
  ni le PC de l'utilisateur, ni le disque externe « yayakoub ».
- Le code de référence est dans le dépôt git `vd-42_exercices`, branche
  `claude/web-app-document-processing-na5del`. Le profil complet est dans `CLAUDE.md`.
- **Prochaine action demandée par l'utilisateur : l'installation pas à pas sur son PC
  Windows** (voir la section « ▶️ Lancer chez toi » plus bas). Guide-le écran par écran.

---

## 1. Le besoin (en une phrase)

Un programme **local, gratuit, sans intelligence artificielle** qui parcourt tout seul un
disque en désordre (le disque externe « yayakoub », ~432 000 fichiers, très imbriqués, de
tout), **lit les documents un par un**, en range chaque information dans un classeur
cherchable, **ne perd aucun fichier**, et **ne bloque jamais la machine**.

## 2. Les grandes décisions prises ensemble (l'histoire du projet)

1. **Web app locale, sans IA** : lire un document, en extraire le contenu, le qualifier, le
   ranger dans un format léger et cherchable.
2. **Un petit moteur sur la machine** (et pas seulement le navigateur) : indispensable pour
   balayer un disque tout seul et reprendre après une coupure.
3. **Assembler des briques éprouvées, ne rien réinventer** : moteurs de lecture existants
   (Tesseract pour l'OCR, PyMuPDF pour les PDF, etc.).
4. **Aller chercher les fichiers tout seuls** sur le disque « yayakoub » (Windows), les
   traiter **un par un**, en continu.
5. **Le plus important : le découpage.** Un gros fichier (rapport de 500 pages) est traité
   **par petits bouts** pour ne jamais encombrer la machine.
6. **La finitude (exigence centrale)** : aucun fichier abandonné en silence. Chaque fichier
   finit dans **une case visible**, et un compteur prouve que **100 %** du disque est couvert.
7. **Cartographie à la fin** : on ne range pas la carte d'avance ; elle se reconstitue à
   partir du registre une fois les fichiers passés.

## 3. Ce qui a été construit (et ça marche)

Le robot documentaliste sait déjà :

- **Parcourir tout le disque**, même les dossiers cachés dans des dossiers.
- **Trier chaque fichier à l'entrée** (sans gaspiller d'énergie) :
  - lisible → on l'extrait ;
  - bruit / technique / vidéo / photo brute / inconnu → **catalogué** (on sait où c'est et ce
    que c'est, sans lire le contenu).
- **Lire les documents** : PDF (texte et scannés), Word, Excel, CSV, textes, images (OCR).
- **Repérer les infos utiles** : dates, montants + devise, emails, téléphones, IBAN, TVA,
  SIRET, adresses web… + des **fiches personnalisables** (ex. « facture » = numéro, date,
  total, fournisseur).
- **Tout ranger** dans un classeur unique (fichier `docs.db`) avec une **recherche instantanée**.
- **Garantir la finitude** : états `traité` / `classé` / `à résoudre` / `disparu`, un
  **compteur de couverture**, et une file « à résoudre » **rejouable** (jamais un cimetière).
- **Découper les gros fichiers** (OCR page par page) pour ne jamais bloquer la machine.
- **Reprendre après une coupure** là où il s'était arrêté (jamais deux fois le même fichier).
- **Interface web** locale : recherche, consultation, compteur de couverture, export JSON/CSV.

C'est **testé** : 19 vérifications automatiques passent. Démo réelle sur 8 fichiers → **100 %
de couverture** (4 traités, 3 classés, 1 à résoudre avec son motif).

## 4. Comment ça marche (le parcours d'un fichier)

```
Disque « yayakoub »
      │  (balayage auto + surveillance des nouveaux fichiers)
      ▼
  File d'attente  →  Triage  →  ┌─ lisible ─► Extraction (par petits bouts)
                                │              → Qualification (infos + fiches)
                                │              → Audit → ✅ TRAITÉ
                                └─ non lisible ─► 🏷️ CLASSÉ (catalogué)
      Échec après toutes les tentatives ─► 🔧 À RÉSOUDRE (motif, rejouable)
      Fichier disparu du disque ─────────► 🔴 DISPARU
                                │
                                ▼
                Classeur SQLite (cherchable) + Interface web
```

**Règle d'or :** `total = traités + classés + à résoudre + disparus`. Toujours. Zéro invisible.

## 5. Où c'est rangé

- **Le programme** (la recette) : en ligne, dépôt git `vd-42_exercices`. Sauvegardé.
- **Les résultats** (quand tu le lances) : **un seul fichier** `data/docs.db` sur ton PC.
  C'est ton classeur — lisible avec n'importe quel outil SQLite, et via l'interface web.

## 6. Ce qui reste à faire (optionnel, à décider plus tard)

- Lire **encore plus de formats** (vieux `.doc`, PowerPoint, emails…) via **Apache Tika**
  (déjà branché en option, nécessite d'installer Java une fois).
- Détecter les **copies presque identiques** (« copies de copies »).
- **Reconnaître le contenu des images** (logo, capture, graphique…) via un petit modèle local.

## 7. ▶️ Lancer chez toi (installation pas à pas — Windows)

> Objectif : voir l'application **chez toi**, avec **tes** fichiers. À faire une seule fois.

1. **Télécharger le programme** : page GitHub du projet → bouton vert **« Code »** →
   **« Download ZIP »**. Décompresser dans un dossier simple, ex. `C:\yayakoub-outil`.
2. **Installer Python** (le moteur) : python.org → « Download ». **Cocher « Add Python to
   PATH »** pendant l'installation.
3. *(Facultatif au début)* **Installer Tesseract** (pour lire les images/scans) : chercher
   « Tesseract OCR Windows UB Mannheim », langues **français + anglais**.
4. **Régler le disque** : brancher « yayakoub », noter sa **lettre** (ex. `E:`). Double-cliquer
   sur `start.bat` une première fois (il crée `config.yaml`), puis dans `config.yaml` mettre
   `watch_path: "E:\\"`.
5. **Lancer** : double-cliquer sur `start.bat`, puis ouvrir le navigateur sur
   **http://127.0.0.1:8000**.

Le détail imagé complet est dans le fichier **`GUIDE.md`** (fourni avec le programme).

## 8. 🛠️ Annexe technique (pour Claude, pas pour l'utilisateur)

- **Structure** : `docengine/` (moteur), `web/` (interface), `templates/` (fiches `.yaml`),
  `tests/` (vérifications), `sample/` (exemples).
- **Modules clés** : `watcher.py` (balayage/surveillance), `store.py` (base SQLite + registre
  d'états + FTS5), `triage.py` (classement à l'entrée), `worker.py` (cascade de résolution +
  audit Write-Audit-Publish), `extract.py` (lecture par lots), `detectors.py` (règles regex),
  `templates.py` (fiches), `api.py` (interface web).
- **États de finitude** : `pending`, `processing`, `done`, `classified`, `to_resolve`, `missing`.
- **Lancer les tests** : `python -m pytest tests/ -q` (doivent tous passer avant un commit).
- **Lancer le moteur** : `python -m docengine` (options : `--no-web`, `--scan-only`, `--config`).
- **Options utiles (config.yaml)** : `batch_pages` (découpage), `max_text_bytes` (garde-fou
  mémoire), `enable_tika` (extraction universelle, Java requis).
- **Branche de travail** : `claude/web-app-document-processing-na5del`.
