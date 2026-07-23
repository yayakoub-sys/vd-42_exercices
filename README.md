# Moteur local d'extraction & consignation de documents

Un outil **100 % local**, **open-source**, **gratuit** et **sans IA** qui va chercher tout
seul les documents d'un disque défini (ex. le volume **« yayakoub disque »**), les lit **un
par un**, en extrait le contenu, le **qualifie** par des règles, et **consigne** le tout dans
une base **SQLite** légère et interrogeable — où **chaque information est isolée et facilement
récupérable**.

Le projet **n'invente aucun moteur** : il **assemble** des briques matures et éprouvées
(Tesseract pour l'OCR, PyMuPDF pour les PDF, python-docx, openpyxl…) et se contente de les
orchestrer et de les personnaliser.

## Ce que ça fait

```
[ Disque « yayakoub disque » ]
        │  (balayage auto + surveillance temps réel)
        ▼
   File d'attente (SQLite)  ──►  Worker (traite 1 fichier à la fois)
                                     │
             Extraction ────────────┤   PDF / OCR / Word / Excel / CSV / texte
             Qualification ─────────┤   détection auto (regex) + modèles de champs
                                     ▼
                     Base SQLite (documents + entités + champs + FTS5)
                                     │
                          Interface web locale (rechercher / consulter / exporter)
```

- **Va chercher les fichiers tout seul** sur le volume défini, et détecte les nouveaux
  fichiers en temps réel.
- **Traitement un par un**, robuste : **« reprend quand c'est cassé »** (voir plus bas).
- **Extraction** : PDF texte, **PDF scannés & images (OCR)**, Word `.docx`, Excel `.xlsx`,
  `.csv`, `.txt`, `.md`.
- **Qualification sans IA**, deux niveaux :
  - **Détection auto par motifs** : dates, montants + devise, emails, téléphones, IBAN,
    TVA, SIRET, URLs…
  - **Modèles de champs** que **vous définissez** en YAML (ex. `facture` → numéro, date,
    total…). Voir `templates/facture.yaml`.
- **Consignation « très bien rangée »** dans SQLite + **recherche plein-texte (FTS5)**.
- **Interface web locale** pour rechercher, consulter et **exporter en JSON / CSV**.

## Installation (Windows)

1. Installer **Python 3.10+** (cocher « Add Python to PATH »).
2. Installer **Tesseract OCR pour Windows** (build UB-Mannheim) — nécessaire pour l'OCR des
   scans/images. Ajouter son dossier au `PATH`, et les données de langue **fra** + **eng**.
3. Dans le dossier du projet :
   ```
   pip install -r requirements.txt
   ```

> L'OCR est optionnel : sans Tesseract, tout le reste (PDF texte, Word, Excel, CSV, texte)
> fonctionne ; seuls les scans/images seront marqués en erreur.

## Configuration

Copier `config.example.yaml` en `config.yaml`, puis régler **`watch_path`** sur la lettre du
lecteur du disque (repérable dans l'Explorateur), par exemple :

```yaml
watch_path: "E:\\"
ocr_langs: [fra, eng]
poll_on_start: true
```

## Lancement

- **Simple** : double-cliquer sur **`start.bat`** (crée `config.yaml` au premier lancement,
  puis démarre le moteur + l'interface).
- **En ligne de commande** :
  ```
  python -m docengine              # traitement + interface web (http://127.0.0.1:8000)
  python -m docengine --no-web     # traitement seul
  python -m docengine --scan-only  # traite l'existant puis s'arrête
  ```

Ouvrir ensuite **http://127.0.0.1:8000** pour rechercher et consulter.

## Garantie de finitude (aucun fichier perdu en silence)

Le principe central : **chaque fichier finit dans un état visible**, et
`total = traités + classés + à_résoudre + disparus + en_cours` — **toujours**. Un tableau de
bord de couverture affiche ce compte en direct (objectif : 100 %, 0 fichier invisible).

- **Triage à l'entrée** (`triage.py`) : chaque fichier est classé vite et sans gaspiller
  d'énergie — `readable` (on extrait), ou `noise` / `technical` / `video` / `raw_photo` /
  `unknown` (**catalogués** : on sait où c'est et ce que c'est, sans lire le contenu).
- **Cascade de résolution** : l'échec est le **dernier** recours. Le worker essaie plusieurs
  stratégies (lecteur natif → Tika si activé → OCR forcé pour les PDF) avant d'abandonner.
- **Quality gate (Write-Audit-Publish)** : un fichier n'est marqué **traité** qu'après un
  **audit** de son résultat (texte attendu mais vide = non traité). Pas de demi-travail.
- **File « à résoudre » = liste de travail, pas un cimetière** : les échecs gardent un
  **motif** et sont **rejoués** automatiquement (au démarrage, périodiquement, ou via le bouton
  « Rejouer » de l'interface). Impossible que des milliers de fichiers disparaissent sans trace.
- **Découpage des gros fichiers** : les PDF sont océrisés **page par page, par lots**
  (`batch_pages`), et les gros fichiers texte lus par blocs avec garde-fou mémoire
  (`max_text_bytes`) → la machine **ne bloque jamais**.
- **Cartographie a posteriori** : la carte du disque n'est pas construite d'avance ; elle se
  **reconstitue** par requêtes sur le registre (`jobs`) une fois les fichiers passés.

Extraction universelle optionnelle : **Apache Tika** (`enable_tika: true`, nécessite Java)
étend la lecture à 1400+ formats ; sinon les lecteurs Python natifs suffisent (mode léger).

## Reprise sur incident (« reprendre quand c'est cassé »)

La robustesse repose sur la table `jobs` (un enregistrement par fichier : statut, hash,
tentatives) :

- **Idempotence** : un fichier est identifié par le **hash SHA-256** de son contenu ; il n'est
  **jamais retraité** s'il est déjà consigné.
- **Consignation transactionnelle** : un fichier n'est marqué `done` qu'après écriture
  **complète** en base (aucun état à moitié écrit).
- **Récupération au démarrage** : tout job resté `processing` (coupure/plantage) est
  automatiquement remis en `pending`.
- **Réessais** : les fichiers en `error` sont relancés jusqu'à `max_retries`.

Concrètement : coupez le moteur en plein traitement, relancez-le → il repart où il s'était
arrêté, sans retraiter l'existant.

## Personnaliser les champs extraits

Ajouter un fichier `templates/<mon_modele>.yaml`. Chaque champ liste des motifs regex ; le
premier qui correspond remplit le champ (groupe 1 s'il existe). Un modèle peut cibler certains
documents via `match` (mots-clés). Voir `templates/facture.yaml` comme exemple.

## Format de consignation (SQLite)

| Table            | Contenu                                                        |
|------------------|----------------------------------------------------------------|
| `documents`      | un enregistrement par fichier (texte intégral, métadonnées)    |
| `entites`        | chaque info qualifiée : `type, value, raw, position`           |
| `champs`         | valeurs des modèles de champs personnalisés                    |
| `documents_fts`  | index plein-texte (FTS5) pour la recherche instantanée         |
| `jobs`           | registre maître : état de finitude + motif de chaque fichier    |

La base est un simple fichier (`data/docs.db`), lisible avec n'importe quel outil SQLite.

## Tests

```
pip install pytest
python -m pytest tests/ -q
```

Les tests couvrent les détecteurs, la normalisation, les modèles de champs, la recherche
plein-texte, l'idempotence et la **reprise sur incident** — sans dépendance à l'OCR.

## Arborescence

```
docengine/        # le moteur (extraction, qualification, file, worker, watcher, API)
web/              # interface web locale (HTML/CSS/JS)
templates/        # modèles de champs personnalisables (.yaml)
tests/            # tests unitaires
sample/           # document d'exemple
config.example.yaml
requirements.txt
start.bat         # lanceur Windows
```
