# GATE — les contrôles, avant et après

**À jour au 2026-08-04.** Chaque contrôle a été **essayé pour de vrai** sur ce poste. Ceux qui
ne marchent pas sont marqués comme tels, plutôt que recopiés d'un ancien document.

Règle générale : **un contrôle qu'on n'a pas lancé n'est pas un contrôle.** Ne jamais écrire
« les tests passent » sans les avoir vus passer.

---

## GATE 0 — au début de chaque session

| # | Contrôle | Commande | Attendu |
|---|---|---|---|
| 0.1 | Où on est | `git status --short` puis `git log --oneline -5` | Branche `claude/universal-qr-code-reader-4cdw9s` |
| 0.2 | Ce qui n'est pas sauvegardé | `git rev-list --left-right --count origin/claude/universal-qr-code-reader-4cdw9s...HEAD` | ✅ **`0  0`** au 2026-08-04 : tout est poussé |
| 0.3 | Place sur le disque | `Get-PSDrive C` | ≥ 3 Go. Était à **9,47 Go** (émulateur allumé). |

**Si 0.2 n'est pas à `0 0`, le dire à l'utilisateur avant toute autre chose.** Les correctifs
Android ne seraient alors protégés que sur ce disque.

---

## GATE 1 — avant de toucher à Android

### 1.1 Le garde-fou absolu

Avant **toute** commande contenant `expo`, vérifier qu'elle n'est pas dans cette liste :

```
expo prebuild        pnpm prebuild        pnpm prebuild:development
expo run:android     pnpm android         pnpm android:preview
```

Ces commandes **régénèrent `easypay/android/`** et effacent quatre des cinq correctifs.

**Contrôle après coup**, si un doute existe :

```bash
git status --short easypay/android
```

Doit être **vide**. S'il ne l'est pas : `git checkout -- easypay/android`.

### 1.2 Les cinq correctifs sont-ils toujours là ?

```bash
grep -c "node-linker=hoisted"        easypay/.npmrc
grep -c "CMAKE_OBJECT_PATH_MAX"      easypay/android/build.gradle
grep -c "canonical-prefixes"         easypay/android/fix-canonical-prefixes.cmake
grep -c "buildStagingDirectory"      easypay/android/app/build.gradle
grep -c "reactNativeArchitectures"   easypay/android/gradle.properties
```

Chacun doit renvoyer **au moins 1**.

### 1.3 Avant un build natif

| # | Contrôle | Seuil |
|---|---|---|
| 1.3.1 | Espace sur `C:` | **≥ 4 Go.** Un build complet consomme ≈ 3,5 Go. |
| 1.3.2 | Émulateur arrêté ? | Le laisser tourner est possible, mais la mémoire descend à zéro. Fermer Android Studio pendant la compilation aide réellement. |
| 1.3.3 | `JAVA_HOME` | Doit valoir `C:\Users\VAYA DIOMANDE\.jdks\jbr-21.0.11`. **Surtout pas** le JBR embarqué d'Android Studio (JDK 25 : Gradle 8.14.3 ne supporte Java que jusqu'à 24). |

---

## GATE 2 — avant de dire « l'application marche »

Ne jamais l'affirmer sans ces quatre preuves. C'est la séquence qui a servi le 2026-08-04.

| # | Preuve | Comment | Résultat obtenu |
|---|---|---|---|
| 2.1 | L'émulateur démarre | `adb shell getprop sys.boot_completed` → `1` | ✅ 70 s |
| 2.2 | L'application est au premier plan | `adb shell dumpsys activity activities \| findstr topResumedActivity` → doit contenir **`.MainActivity`**, PAS `DevLauncherErrorActivity` | ✅ |
| 2.3 | L'écran est le bon | `adb exec-out screencap -p > ecran.png` puis **regarder l'image** | ✅ |
| 2.4 | Le Fast Refresh vit | Modifier un texte dans `easypay/src/app/`, attendre 30 s, recapturer, **puis annuler la modification** | ✅ < 30 s |

> ⚠️ **`topResumedActivity` contenant `DevLauncherErrorActivity` = l'application est en
> erreur**, même si quelque chose s'affiche. Capturer l'écran et lire l'exception.

---

## GATE 3 — quand un symptôme n'a pas de sens

Délai dépassé, écran blanc, « ne répond pas », lenteur inexplicable.

**Dans cet ordre. Ne pas sauter d'étape, ne pas conclure « machine trop petite » avant la fin.**

| # | Vérifier | Commande | Ce qu'on cherche |
|---|---|---|---|
| 3.1 | **Un plantage en boucle** | `adb logcat -d -b crash -t 200` | `FATAL EXCEPTION` répété. Le coupable connu : `com.google.android.gms.persistent`. |
| 3.2 | La charge du téléphone | `adb shell top -n 1 -b -o %CPU,ARGS` | Le pourcentage d'**inactivité**. Sain ≈ 397 %. |
| 3.3 | Le pont vers Metro | `adb reverse --list` | Doit contenir `tcp:8081 tcp:8081`. **Il tombe tout seul.** Alternative sans pont : l'adresse `10.0.2.2:8081`. |
| 3.4 | Metro répond | `curl http://localhost:8081/status` | `packager-status:running` |
| 3.5 | Le bundle est prêt | Lire la fenêtre Metro | `Android Bundled …`. Tant qu'il compile, l'application abandonnera. |
| 3.6 | La mémoire de l'hôte | `Get-CimInstance Win32_OperatingSystem` | Tombe à zéro pendant une compilation. **C'est la dernière hypothèse, pas la première.** |

**Pourquoi cet ordre.** Le 2026-08-04, les symptômes 3.6 (mémoire à zéro) et 3.5 (compilation
lente) étaient bien réels — mais la **cause** était 3.1 : Play Services plantait plusieurs fois
par seconde et saturait le processeur. Chercher d'abord côté mémoire a coûté du temps.

---

## GATE 4 — avant un commit

| # | Contrôle | Commande | État sur ce poste |
|---|---|---|---|
| 4.1 | Rien d'involontaire | `git status --short` | — |
| 4.2 | Aucun secret | Relire le diff | — |
| 4.3 | Tests EasyPay | `cd easypay && npx jest` | ⚠️ **53 passent, 1 échoue** (voir 4.3 plus bas) |
| 4.4 | Types EasyPay | `cd easypay && npx tsc --noemit` | ✅ **PASSE** — 0 erreur, vérifié le 2026-08-04 |
| 4.5 | Style EasyPay | `cd easypay && npx eslint .` | ⚠️ **157 erreurs, 33 avertissements** (voir 4.5 plus bas) |
| 4.6 | Tests docengine | `python -m pytest tests/ -q` | ❌ **IMPOSSIBLE** (voir 4.6 plus bas) |

**Référence à retenir** : sur un dépôt sain aujourd'hui, 4.3 donne **53/54** et 4.5 donne
**157 erreurs**. Tout écart au-delà est une régression introduite par le travail en cours.

### ⚠️ 4.3 — l'échec connu, à ne pas confondre avec une régression

```
● button component › should apply correct styles based on size prop
  Attendu : "font-inter font-semibold text-white dark:text-black text-xl"
  Reçu    : "font-inter font-semibold text-white text-xl"
  easypay/src/components/ui/button.test.tsx:88
```

**Il échouait déjà avant cette session.** La référence est donc **53 / 54**, pas 54 / 54.
Si un autre test tombe, c'est une vraie régression.

Le test attend une variante sombre que le composant ne produit pas. Avant de « corriger »,
décider laquelle des deux est la vérité produit : le bouton **doit-il** changer de couleur en
mode sombre ? C'est une question de besoin, à poser à l'utilisateur.

### ⚠️ 4.5 — le style n'est pas propre, et ce n'est pas nouveau

✅ VÉRIFIÉ le 2026-08-04 : **190 problèmes — 157 erreurs, 33 avertissements.**
Presque uniquement de la mise en forme, héritée du modèle de départ :

```
style/arrow-parens                 parenthèses inutiles autour d'un argument unique
style/indent                       indentation de 4 espaces au lieu de 2
style/semi, style/member-delimiter-style   points-virgules manquants
ts/consistent-type-definitions     `interface` au lieu de `type`
```

**140 erreurs et 21 avertissements sont réparables automatiquement** par `npx eslint . --fix`.

⚠️ **Ne pas lancer `--fix` à la légère** : cela remanierait des dizaines de fichiers en une
fois, noierait toute vraie modification dans le bruit, et rendrait la relecture impossible.
Si on le fait un jour, ce doit être **un commit isolé qui ne fait que ça**, et après avoir
vérifié que 4.3 et 4.4 sont dans le même état qu'avant.

### ❌ 4.6 — pourquoi le contrôle docengine ne marche pas

Python 3.12.10 est présent, mais `pytest` n'est pas installé et il n'existe **aucun
environnement virtuel**. Les dépendances de `requirements.txt` n'ont jamais été installées
sur ce poste.

L'ancien `CLAUDE.md` exigeait ce contrôle avant chaque commit : il était **invérifiable**.

**Pour le rendre exécutable un jour** (non fait, demande l'accord de l'utilisateur — plusieurs
centaines de Mo, dont Tesseract et PyMuPDF) :

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt pytest
python -m pytest tests/ -q
```

Tant que ce n'est pas fait : **ne pas modifier `docengine/`**, ou le dire clairement comme
non testé.

---

## GATE 5 — avant de supprimer ou d'écraser quoi que ce soit

Claude s'exécute sur le vrai PC. Une suppression est réelle.

| # | Règle |
|---|---|
| 5.1 | **Regarder d'abord.** Lister le contenu, mesurer la taille, dire ce qu'on va supprimer. |
| 5.2 | **Remplacer avant de retirer.** L'AVD Pixel Fold n'a été effacé qu'**après** que le Pixel 8 ait démarré, installé l'APK et fait tourner l'application. |
| 5.3 | **Commiter avant d'effacer** un fichier non suivi par git, pour qu'il reste récupérable. C'est ce qui a été fait pour les deux lanceurs `.bat`. |
| 5.4 | **Ne jamais supprimer le SDK de `C:`** tant qu'un build n'a pas été validé depuis `H:`. |
| 5.5 | Ce qu'on peut effacer sans crainte, car reconstructible : `C:\cxx-easypay`, `easypay/android/build`, `easypay/android/app/build`. |

### 5.6 — le geste de secours quand `C:` devient critique

Le fichier `snapshots\default_boot\ram.img` de l'AVD pèse **2 560 Mo**. C'est la mémoire
vive du téléphone virtuel : il est **recréé à chaque démarrage**, donc parfaitement sûr à
supprimer — mais **seulement émulateur éteint**.

```powershell
adb emu kill
Get-Process emulator -EA SilentlyContinue | Stop-Process -Force
Remove-Item "$env:USERPROFILE\.android\avd\Pixel_8_API_35.avd\snapshots" -Recurse -Force
```

Gain constaté : `C:` de 9,51 à 12,01 Go. À refaire à volonté.

⚠️ **Ne pas le faire émulateur allumé** : le fichier est en cours d'utilisation.

### 5.7 — les décisions de stockage sont PRISES, ne pas les rouvrir

Arbitré et exécuté le 2026-08-04, **mesures à l'appui** (voir [ETAT.md](ETAT.md) § 5) :

- Le **SDK reste sur `C:`**. C'est la pièce la plus sollicitée de la chaîne. La copie sur
  `H:` a été **supprimée**.
- **Rien d'autre ne quitte `C:`** : tout ce qui y reste de volumineux est vivant.
- Le **cache Gradle reste sur `H:`** (`GRADLE_USER_HOME`). C'était le bon déplacement.
- `C:\cxx-easypay` **doit** rester sur `C:` : ce dossier existe pour être un chemin court.

**Ne pas re-débattre sans nouvelles mesures.**

---

## GATE 6 — avant de clore une session

| # | Contrôle |
|---|---|
| 6.1 | `git status --short` — plus rien d'important en suspens ? |
| 6.2 | Les commits sont-ils **poussés** ? Sinon, le dire à l'utilisateur. |
| 6.3 | [ETAT.md](ETAT.md) reflète-t-il la réalité, y compris ce qui est cassé ? |
| 6.4 | La mémoire froide est-elle à jour (`MEMORY.md` + fiche de reprise) ? |
| 6.5 | Les processus lourds : émulateur, Metro, Android Studio — dire lesquels restent allumés. |
