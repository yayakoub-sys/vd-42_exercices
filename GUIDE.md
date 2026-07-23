# Guide de démarrage — version simple (sans être technicien)

Ce guide explique comment **lancer le programme chez toi**, sur ton PC Windows, avec ton
disque « yayakoub » branché.

> 🧠 À retenir : **Claude fabrique le programme dans le cloud, toi tu le lances sur ton PC.**
> Claude ne voit pas ton disque « yayakoub » — c'est normal, et c'est plus sûr (rien ne sort
> de chez toi).

---

## Ce dont tu as besoin une seule fois (installation)

1. **Installer Python** (le moteur qui fait tourner le programme)
   - Va sur https://www.python.org/downloads/ → bouton jaune « Download ».
   - Pendant l'installation, **coche la case « Add Python to PATH »** (importante).

2. **Installer Tesseract** (pour lire le texte des images et scans) — *facultatif au début*
   - Cherche « Tesseract OCR Windows UB Mannheim » et installe-le.
   - Choisis les langues **français** et **anglais**.
   - Si tu sautes cette étape : tout fonctionne, sauf la lecture des images/scans.

---

## Mettre le programme sur ton PC

1. Sur la page du projet (GitHub), bouton vert **« Code »** → **« Download ZIP »**.
2. Décompresse le ZIP quelque part de simple, par exemple `C:\yayakoub-outil`.

---

## Le régler pour ton disque (une seule fois)

1. Branche ton disque « yayakoub ». Ouvre l'**Explorateur de fichiers** et **note sa lettre**
   (par exemple `E:` ou `D:`).
2. Dans le dossier `C:\yayakoub-outil`, **double-clique sur `start.bat`**.
   - La première fois, il crée un fichier de réglages et te le dit.
3. Ouvre le fichier **`config.yaml`** (avec le Bloc-notes) et à la ligne `watch_path`, mets la
   lettre de ton disque. Exemple :
   ```
   watch_path: "E:\\"
   ```
   (garde bien les deux `\\` et les guillemets)
4. Enregistre le fichier.

---

## Lancer (à chaque fois)

1. **Double-clique sur `start.bat`.**
2. Le programme se met à parcourir ton disque et à ranger les fichiers, un par un.
3. Ouvre ton navigateur (Chrome, Edge…) et va à l'adresse : **http://127.0.0.1:8000**
4. Là, tu peux :
   - 🔍 **chercher** une info dans tous tes documents,
   - 📊 voir le **compteur de couverture** (combien de fichiers traités / rangés / à réparer),
   - 📤 **exporter** ce que tu veux.

Pour arrêter : ferme la fenêtre noire du programme. La prochaine fois, il **repart où il
s'était arrêté** — il ne recommence pas tout.

---

## Si quelque chose cloche

- **Rien ne s'affiche sur la page** → attends quelques secondes et rafraîchis ; le programme
  démarre.
- **Des fichiers en « à résoudre »** → c'est normal, ils ne sont pas perdus. Clique sur
  **« Rejouer »** dans la page, ou dis-le à Claude pour qu'il regarde le motif.
- **Le disque n'est pas trouvé** → vérifie que la lettre dans `config.yaml` est la bonne.

Tu n'as **jamais** besoin de comprendre le code. En cas de doute, tu décris à Claude ce que tu
vois (« ça affiche ça », « ça bloque là ») et il s'occupe du reste.
