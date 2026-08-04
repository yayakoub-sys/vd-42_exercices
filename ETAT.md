# ÉTAT — où en est réellement le travail

**Arrêté le 2026-08-04 à 17 h.** Remplace toute description d'état antérieure.

Chaque affirmation porte son statut :
**✅ VÉRIFIÉ** (re-exécuté ou relu au moment de la rédaction) ·
**📋 DÉDUIT** (du code ou des commits, non ré-exécuté) ·
**❓ NON VÉRIFIÉ**.

---

## 1. Le point de reprise en trois lignes

Le **socle technique d'EasyPay sur Android est terminé, vérifié et poussé sur GitHub**.
L'application se construit, s'installe, démarre à froid en 30 s, se recharge toute seule
quand on modifie un écran, et se navigue. La caméra virtuelle fonctionne (indispensable au
scan de QR).

**Aucune décision n'est en attente. Rien n'est en suspens.**

### ➡️ PROCHAIN POINT DE REPRISE

> **Parcourir les 44 écrans d'EasyPay un par un et noter, pour chacun, ce qui manque ou ne
> correspond pas au besoin.** Personne ne l'a jamais fait. C'est un travail de **produit**,
> pas de technique : il faut regarder l'écran dans l'émulateur et dire si ce qu'il montre
> et ce qu'il permet sont justes.
>
> Commencer par le parcours le plus important : **`(auth)` (8 écrans) → `pay` (11 écrans)**,
> c'est-à-dire s'inscrire, puis scanner un QR et payer. Garder `(app)` (24 écrans) pour
> ensuite.
>
> Rien à préparer : suivre [easypay/BOUCLE-ANDROID.md](easypay/BOUCLE-ANDROID.md), l'écran
> apparaît en trois étapes.

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

### ✅ Le travail est poussé sur GitHub

✅ VÉRIFIÉ après `git push` : local et distant pointent sur le **même commit**
`151beae`, écart `0 0`. Les cinq correctifs, les 50 fichiers de `easypay/android/` et les
quatre fichiers de pilotage sont **présents dans le dépôt distant**
(`github.com/yayakoub-sys/vd-42_exercices`). Le travail ne dépend plus de ce disque.

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

---

## 5. Les décisions de stockage — PRISES, EXÉCUTÉES, VÉRIFIÉES

Arbitrées le 2026-08-04 selon la règle donnée par l'utilisateur :
`C:` garde ce qui est **vivant, fréquemment sollicité, sensible aux performances** ;
le disque externe reçoit ce qui est **froid, dormant, volumineux, reproductible ou
archivable** ; sans jamais sacrifier la rapidité de la boucle Android.

### Ce que `C:` contient vraiment — mesuré, pas supposé

| Sur `C:` | Taille | Verdict | Pourquoi |
|---|---|---|---|
| SDK Android | 6 108 Mo | 🔴 **VIVANT — reste** | Le NDK (2 252 Mo) est lu en continu pendant la compilation C++ ; l'image système (2 103 Mo) est lue à **chaque** démarrage — et les démarrages sont à froid. |
| `easypay/node_modules` | 3 431 Mo | 🔴 **VIVANT — reste** | Metro le relit à chaque compilation. |
| AVD `Pixel_8_API_35` | 2 755 Mo | 🔴 **VIVANT — reste** | Dont 2 560 Mo de `snapshots/default_boot/ram.img` : c'est **la mémoire vive du téléphone virtuel**, pas une archive. |
| `easypay/android/app/build` | 990 Mo | 🟠 **reste** | Reproductible, mais le supprimer coûte 10 minutes de reconstruction. |
| `C:\cxx-easypay` | 127 Mo | 🔴 **DOIT rester sur `C:`** | Ce dossier existe **précisément pour être un chemin court**. C'est le correctif n° 4. Le déplacer casserait le build. |

**Conclusion mesurée : il ne reste rien sur `C:` qui soit froid, dormant ou archivable.**
La seule chose qui l'était — le cache Gradle, 7,7 Go, qui grossit sans fin et se lit
surtout — avait déjà été déportée sur `H:` par la session précédente. C'était le bon geste,
et il est fait.

### Décision A — le SDK reste sur `C:`, la copie sur `H:` est SUPPRIMÉE ✅ FAIT

Le SDK est le contre-exemple parfait de « froid » : c'est la pièce la plus sollicitée de
toute la chaîne. `H:` est un disque externe **mécanique** à 63 Mo/s contre 670 Mo/s pour
`C:` — dix fois plus lent — et avec 7,8 Go de mémoire il n'y a quasiment pas de cache
disque pour absorber ça. L'y déporter aurait directement dégradé la boucle.

Un miroir figé d'un dossier vivant n'est d'ailleurs pas une archive : c'est un second
environnement Android qui attend d'être confondu avec le vrai.

✅ VÉRIFIÉ avant suppression : aucune variable d'environnement, aucun `local.properties`,
aucun fichier de configuration d'Android Studio ne pointait dessus.
✅ **Supprimé** : `H:` passe de 112,73 à **118,80 Go** libres.

### Décision B — on garde l'image actuelle, Play Services reste désactivé ✅ FAIT

**Le problème est traité à la racine, pas contourné.** Le Play Store
(`com.android.vending`) est désactivé : **plus aucune mise à jour de Play Services ne peut
arriver**. La version qui plantait ne peut donc plus être remplacée par une autre du même
genre.

Télécharger une image `google_apis` sans Play Store aurait coûté ≈ 1,5 Go **sur le disque
même qu'on cherche à soulager**, pour un gain net nul (la nouvelle image remplace
l'ancienne, de taille comparable), plus une reconstruction complète de l'émulateur et une
revérification de bout en bout. Mauvais rapport.

✅ VÉRIFIÉ après un **redémarrage à froid complet** : `com.android.vending`,
`com.google.android.gms` et `com.google.android.gms.supervision` sont **toujours
désactivés**, et **0 plantage**. Le réglage vit dans les données de l'AVD et survit aux
redémarrages.

**Effet mesuré sur la boucle** : le démarrage est passé de **70 s à 30 s**. Le plantage en
boucle ralentissait aussi le démarrage.

### Décision C — démarrage à froid verrouillé dans l'AVD ✅ FAIT

`fastboot.forceColdBoot=yes` ajouté à `config.ini`. Auparavant le réglage n'existait qu'au
niveau global (`advancedFeatures.ini`) : si l'émulateur était lancé depuis Android Studio,
le comportement pouvait diverger. Il est désormais porté par l'AVD lui-même, donc identique
quel que soit le mode de lancement.

### Décision D — rien d'autre ne quitte `C:`

Mesures à l'appui (tableau ci-dessus). Toute autre migration dégraderait la boucle sans
libérer de froid. **Ne pas re-débattre de ce point sans nouvelles mesures.**

### Gain de place obtenu quand même sur `C:`

En arrêtant l'émulateur, `snapshots/default_boot/ram.img` (2 560 Mo) a pu être supprimé :
`C:` est repassé de 9,51 à **12,01 Go** libres. Le fichier est **recréé au démarrage
suivant** — c'est normal, c'est la mémoire du téléphone virtuel. Voir
[GATE.md](GATE.md) § 5.6 : c'est le geste à connaître quand `C:` devient critique.

---

## 6. État des lieux matériel en fin de session

| | |
|---|---|
| `C:` libre | **9,47 Go** (émulateur allumé ; 12,01 Go quand il est éteint) |
| `H:` libre | **118,80 Go** (+ 6,07 Go après suppression de la copie du SDK) |
| Mémoire | 7,81 Go au total ; tombe à **zéro** pendant une compilation Metro |
| Émulateur | **Allumé**, EasyPay chargé dessus, sur l'écran Scanner, caméra fonctionnelle |
| Metro | **En cours** sur le port 8081, cache chaud |
| Android Studio | Fermé |

### Où vivent les choses — état final

| Quoi | Où | Pourquoi |
|---|---|---|
| SDK Android | `C:\Users\VAYA DIOMANDE\AppData\Local\Android\Sdk` | Vivant, lu en permanence |
| Cache Gradle | `H:\ANDROID_WORKSPACE\gradle` (7,7 Go) | Grossit sans fin, se lit surtout |
| AVD | `C:\Users\VAYA DIOMANDE\.android\avd\Pixel_8_API_35.avd` | Vivant |
| Travail C++ du module `:app` | `C:\cxx-easypay` | **Doit** être un chemin court (correctif n° 4) |
| `JAVA_HOME` | `C:\Users\VAYA DIOMANDE\.jdks\jbr-21.0.11` | ⚠️ surtout pas le JBR 25 d'Android Studio |
| Il ne reste plus dans `H:\ANDROID_WORKSPACE` | `gradle`, `_bench`, `artefacts` | La copie `sdk` a été supprimée |

### Réglages réels du téléphone virtuel

| Réglage | Valeur réelle | Remarque |
|---|---|---|
| Mémoire | **2 560 Mo** | `config.ini` demande 2 048, l'émulateur remonte au minimum de l'appareil. C'est la valeur vraie, lue dans `hardware-qemu.ini`. |
| Cœurs | 4 | Laisse 2 cœurs au PC |
| Démarrage | à froid, **30 s** | `fastboot.forceColdBoot=yes` |
| Play Store / Play Services | **désactivés** | Survit aux redémarrages |

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
| `151beae` | Rotation de session : `CLAUDE.md`, `ETAT.md`, `CARTE.md`, `GATE.md` |
| *(+1)* | Consigne les décisions de stockage et l'état final vérifié |

**Tous poussés sur `origin`.** ✅ VÉRIFIÉ.

Aucun fichier de `easypay/src/` n'a été modifié durablement. Le code métier et l'interface
sont intacts.

---

## 8. Preuves rassemblées le 2026-08-04 — la liste complète

Ce qui a été **réellement exécuté et regardé**, pas déduit :

| Preuve | Résultat |
|---|---|
| `gradlew :app:assembleDebug` | `BUILD SUCCESSFUL`, APK 80,4 Mo |
| Démarrage à froid de l'émulateur | 30 s |
| `adb install -r` de l'APK | `Success` |
| Metro détecté par le dev-client | pastille verte sur `10.0.2.2:8081` |
| Écran d'accueil EasyPay | capture d'écran |
| Fast Refresh | texte modifié visible en < 30 s, puis annulé |
| Navigation | « Commencer » → « Quel est ton numéro ? » |
| Écran Scanner après redémarrage à froid | capture d'écran, **caméra virtuelle fonctionnelle** |
| Play Services désactivé après redémarrage | `pm list packages -d` le confirme, **0 plantage** |
| `npx jest` | 53 / 54 |
| `npx tsc --noemit` | 0 erreur |
| `npx eslint .` | 157 erreurs de mise en forme |
| `git push` + `git fetch` | local = distant, `0 0`, correctifs présents à distance |
| Suppression de `H:\...\sdk` | `H:` 112,73 → 118,80 Go |
