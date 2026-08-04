# ÉTAT — où en est réellement le travail

**Arrêté le 2026-08-04 à 17 h.** Remplace toute description d'état antérieure.

Chaque affirmation porte son statut :
**✅ VÉRIFIÉ** (re-exécuté ou relu au moment de la rédaction) ·
**📋 DÉDUIT** (du code ou des commits, non ré-exécuté) ·
**❓ NON VÉRIFIÉ**.

---

## 1. Le point de reprise en trois lignes

Le **socle technique d'EasyPay sur Android est terminé et vérifié** : l'application se
construit, s'installe, démarre, se recharge toute seule quand on modifie un écran, et se
navigue. Les correctifs qui rendent tout ça possible sont désormais protégés par git.

**La suite naturelle est le parcours fonctionnel des 44 écrans d'EasyPay, qui n'a jamais
commencé.** Personne n'a encore vérifié, écran par écran, que le produit fait ce qu'il doit.

Avant ça, **deux décisions attendent l'utilisateur** (§ 5).

---

## 2. Ce qui est vrai aujourd'hui, projet par projet

### EasyPay — chantier en cours

| Sujet | État |
|---|---|
| Build Android | ✅ VÉRIFIÉ — `BUILD SUCCESSFUL`, APK 80,4 Mo du 2026-08-04 14:50 |
| Application dans l'émulateur | ✅ VÉRIFIÉ — écran d'accueil, navigation « Commencer » → « Quel est ton numéro ? » |
| Fast Refresh | ✅ VÉRIFIÉ — texte modifié dans `src/app/(auth)/welcome.tsx`, visible sur le téléphone en moins de 30 s, sans reconstruction. Modification annulée ensuite. |
| Émulateur | ✅ VÉRIFIÉ — un seul AVD, `Pixel_8_API_35`, 1080×2400, Android 15, x86_64 |
| Tests unitaires | ⚠️ ✅ VÉRIFIÉ — **53 passent, 1 échoue** (voir § 4) |
| Types TypeScript | ✅ VÉRIFIÉ — `tsc --noemit` passe, **0 erreur** |
| Style (ESLint) | ⚠️ ✅ VÉRIFIÉ — **157 erreurs, 33 avertissements**, de mise en forme (voir § 4) |
| Nombre d'écrans | ✅ VÉRIFIÉ — **44 écrans** + 7 gabarits `_layout` + 1 fichier `+html.tsx` = 52 fichiers. Répartition : 24 dans `(app)`, 11 dans `pay`, 8 dans `(auth)`, 1 à la racine. |
| Parcours fonctionnel | ❌ **JAMAIS FAIT** |
| Vraies API de paiement | ❌ Non branchées. ❓ NON VÉRIFIÉ dans le détail. |

> **L'écart « 47 écrans » est tranché.** `PASSATION-EASYPAY.md` et le commit `0f0a865`
> annoncent 47 écrans ; le dossier de reprise laissait la question ouverte. Le comptage
> direct des fichiers de route donne **44**. Retenir 44.

### docengine — en pause

| Sujet | État |
|---|---|
| Code | 📋 DÉDUIT — 11 modules Python présents, non exécutés cette session |
| Dépendances | ⚠️ ✅ VÉRIFIÉ — **non installées sur ce poste** (voir § 4) |
| Tests | ❌ **Impossibles à lancer ici en l'état** (voir § 4) |

### mobile_qr_payer — antérieur

39 fichiers, cœur EMVCo avec tests. 📋 DÉDUIT : remplacé par EasyPay, conservé comme
référence. ❓ NON VÉRIFIÉ : rien n'a été exécuté cette session.

---

## 3. Ce qui a été fait pendant la session du 2026-08-04

### Les correctifs Android sont sortis du danger

`easypay/android/` n'était suivi par **aucun commit** : les quatre correctifs qui s'y
trouvaient pouvaient disparaître sans trace. Le dossier est désormais **versionné** — c'est
une source du projet, plus un dossier généré. 50 fichiers de source ; les sorties de build
restent exclues par le `android/.gitignore` qu'Expo avait produit.

Le risque est passé de **définitif** à **réversible** : `git checkout -- easypay/android`.

### Une boucle de développement unique, vérifiée

- Le **Pixel Fold a été remplacé par un Pixel 8**, sur l'image système déjà installée
  (aucun téléchargement). Le Fold démarrait **déplié en 2208×1840**, format presque carré
  qu'aucun utilisateur d'EasyPay ne verra : tous les écrans étaient jugés dans un format
  faux. Il occupait 3,6 Go. Supprimé **après** validation du remplaçant.
- Le **development build existant a été réutilisé** — aucune reconstruction native de toute
  la session.
- `metro.config.js` → `maxWorkers = 3`. Metro lançait un processus par cœur ; avec
  l'émulateur actif la mémoire libre tombait à **0,00 Go** et Windows permutait sur le
  disque, ce qui rendait la compilation **plus lente**.

### La cause réelle des blocages, qui n'était pas celle qu'on croyait

**Google Play Services plantait plusieurs fois par seconde** sur l'émulateur :

```
java.lang.IllegalArgumentException: NetworkCapability 37 out of range
   at com.google.android.gms.gcm.GcmChimeraService.onCreate
   com.google.android.gms@262833038@26.28.33
```

Le Play Store l'avait mis à jour vers une version compilée pour un Android plus récent que
l'API 35. Le processus saturait le processeur du téléphone virtuel, et **c'est ce qui faisait
expirer toutes les requêtes d'EasyPay** (`SocketTimeoutException`), apparaître les écrans
blancs et les boîtes « ne répond pas ».

La fiche de reprise précédente attribuait déjà ces symptômes à « la machine saturée » :
c'était en réalité **déjà ce plantage**, non diagnostiqué.

Contourné sur l'AVD (✅ VÉRIFIÉ : de processeur saturé à **0 plantage, 397 % d'inactivité**) :

```bash
adb shell pm disable-user --user 0 com.android.vending
adb shell pm disable-user --user 0 com.google.android.gms
adb shell settings put global hide_error_dialogs 1
```

EasyPay n'utilise aucun service Google. Réversible avec `pm enable`. Ces réglages vivent dans
les données de l'AVD et survivent aux redémarrages.

### Un doublon de casse corrigé dans git

Le dépôt contenait **deux entrées** pour le même fichier : `easypay/CLAUDE.md` et
`easypay/claude.md`. Sur Windows elles pointaient sur un seul fichier réel et git affichait
une modification impossible à résoudre ; sur Linux ce seraient deux fichiers distincts. Une
seule entrée subsiste.

---

## 4. Ce qui ne marche pas — dit franchement

### ⚠️ Les 5 commits de cette session ne sont PAS poussés

✅ VÉRIFIÉ : `origin/claude/universal-qr-code-reader-4cdw9s` est **5 commits en retard** sur
le local. Les correctifs Android sont protégés **sur ce disque seulement**. Si le disque
lâche, ils sont perdus malgré le travail de sécurisation.

**C'est le premier geste à proposer à l'utilisateur.** Pousser demande son accord.

### ⚠️ Un test EasyPay échoue

✅ VÉRIFIÉ (`npx jest`, 66 s) : **53 tests passent, 1 échoue**.

```
● button component › should apply correct styles based on size prop
  Attendu : "font-inter font-semibold text-white dark:text-black text-xl"
  Reçu    : "font-inter font-semibold text-white text-xl"
  src/components/ui/button.test.tsx:88
```

Le test attend une variante sombre (`dark:text-black`) que le composant ne produit pas.
📋 DÉDUIT : soit le composant a perdu sa variante sombre, soit le test n'a pas suivi un
changement de style. **Non corrigé** — hors du périmètre de cette session, et il faut savoir
lequel des deux est la vérité produit avant de trancher.

### ⚠️ Le style EasyPay n'est pas propre

✅ VÉRIFIÉ (`npx eslint .`) : **157 erreurs, 33 avertissements.** Presque uniquement de la
mise en forme héritée du modèle de départ — parenthèses superflues, indentation à 4 espaces
au lieu de 2, points-virgules manquants. **140 sont réparables automatiquement.**

Non corrigé volontairement : un `--fix` remanierait des dizaines de fichiers d'un coup et
noierait toute vraie modification. À faire un jour dans **un commit isolé qui ne fait que ça**.
Les types, eux, passent sans erreur.

### ⚠️ Les tests docengine ne peuvent pas être lancés sur ce poste

✅ VÉRIFIÉ : Python 3.12.10 est présent, mais `pytest` n'est pas installé, et il n'y a
**aucun environnement virtuel** (`.venv`, `venv`, `env` absents). Les dépendances de
`requirements.txt` n'ont jamais été installées ici.

Le contrôle « lancer `python -m pytest tests/ -q` avant un commit », écrit dans l'ancien
`CLAUDE.md`, **était donc invérifiable**. Corrigé dans [GATE.md](GATE.md).

### ⚠️ Le contournement Play Services est un pansement

Il tient, mais la solution propre est une image d'émulateur **sans Play Store**
(`google_apis` au lieu de `google_apis_playstore`) : elle ne se met pas à jour toute seule,
consomme moins de mémoire, et n'a pas ce défaut. Coût : ≈ 1,5 Go à télécharger.

---

## 5. Les deux décisions qui attendent l'utilisateur

### Décision A — le SDK Android reste-t-il sur `C:` ?

**Inchangée depuis la session précédente. Rien n'a bougé.**

- Une copie **complète et vérifiée** du SDK existe dans `H:\ANDROID_WORKSPACE\sdk`
  (49 427 fichiers, 5,964 Go, 0 discordance).
- Elle **n'est pas active**. Rien ne pointe dessus. Il n'y a **aucune configuration
  intermédiaire** : soit on garde `C:` et on supprime la copie, soit on bascule.
- Basculer rendrait ≈ 6 Go sur `C:`.
- **Contre** : `H:` est un disque externe USB **mécanique** (63 Mo/s contre 670 Mo/s pour
  `C:`). Le NDK est lu intensivement pendant la compilation C++, et l'image système à chaque
  démarrage d'émulateur — qui est désormais à froid. Avec 7,8 Go de mémoire, il n'y a
  quasiment pas de cache disque pour absorber la lenteur.
- **Avis** : garder `C:` et supprimer la copie sur `H:`.

### Décision B — supprimer définitivement le plantage de Play Services ?

Le contournement tient. La solution durable demande un téléchargement de ≈ 1,5 Go via le
SDK Manager d'Android Studio, puis de recréer l'émulateur sur la nouvelle image.

---

## 6. État des lieux matériel en fin de session

| | |
|---|---|
| `C:` libre | 9,61 Go (était à 12,85 Go en début de session) |
| `H:` libre | 112,73 Go |
| Mémoire | 7,81 Go au total ; tombe à **zéro** pendant une compilation Metro |
| Émulateur | Allumé, EasyPay chargé dessus |
| Metro | En cours sur le port 8081, cache chaud |
| Android Studio | Fermé |

**Rien n'a été déplacé côté stockage cette session.** SDK toujours sur `C:`, cache Gradle
toujours sur `H:\ANDROID_WORKSPACE\gradle`, `JAVA_HOME` toujours sur `jbr-21.0.11`.

### Mesures de compilation utiles

| Situation | Durée |
|---|---|
| Premier bundle, cache froid (2699 modules) | 187 s |
| Même bundle, cache chaud | 26 s |
| Après redémarrage complet de Metro, cache conservé | 37 s |

Le cache vit dans `%TEMP%\metro-cache`. **Ne pas vider le dossier Temp de Windows.**

> **Piège de préchauffage** : l'adresse que l'application demande n'est pas `/index.bundle`,
> c'est `/node_modules/expo-router/entry.bundle` **avec `transform.bytecode=1`**. Préchauffer
> une autre adresse ne sert presque à rien. L'adresse exacte se lit dans le manifeste servi
> par Metro sur `http://localhost:8081/` avec l'en-tête `expo-platform: android`.

---

## 7. Les 5 commits de la session

| Commit | Sujet |
|---|---|
| `466c460` | Protège `android/` et ses cinq correctifs de build Windows |
| `05df78e` | Fige l'état de dépendances et de configuration validé par le build |
| `7fa0a45` | Conserve les deux lanceurs `.bat` avant réorganisation |
| `0d5d1fd` | Établit une boucle de développement Android unique et documentée |
| `5892554` | Corrige le doublon de casse `easypay/CLAUDE.md` / `easypay/claude.md` |

Aucun fichier de `easypay/src/` n'a été modifié durablement. Le code métier et l'interface
sont intacts.
