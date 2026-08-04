# ÉTAT — où en est réellement le travail

**Arrêté le 2026-08-04, troisième session.** Remplace toute description d'état antérieure.
Le § 10 (ressources du poste) date de cette troisième session ; le § 1 (point de reprise) et
le § 9 (parcours produit) datent de la deuxième ; les § 2 à 8 datent de la session de 17 h et
restent vrais **sauf ce que le § 10 corrige** — lire le § 10 avant de se fier aux chiffres
matériels du § 6 et à l'état du téléphone virtuel décrit au § 9.5.

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

La deuxième session du 2026-08-04 a **commencé** le parcours produit et l'a **arrêté en
cours de route** : voir § 9. Ce qui en sort tient en une phrase — **on ne peut pas payer**,
et le parcours produit **ne doit pas être repris tel quel**.

### ➡️ PROCHAIN POINT DE REPRISE

> ⚠️ **NE PAS reprendre l'inspection des 44 écrans.** La décision produit a changé.
>
> **La prochaine session recevra une mission précise portant sur la nouvelle carrosserie
> d'EasyPay.** Cette mission sera donnée par l'utilisateur au début de la session.
>
> **Ne rien anticiper de cette mission** : ne pas l'analyser, ne pas préparer d'architecture,
> ne pas chercher de solution, ne lancer aucune mesure de performance. Attendre l'énoncé.
>
> Avant de commencer, lire quand même le § 9 ci-dessous : il dit ce qui est cassé
> aujourd'hui et ce qui est laissé en dette. Rien de plus.

### ➡️ LE SEUL POINT OUVERT, À TRANCHER PAR L'UTILISATEUR

> Une correction est **écrite mais non prouvée** dans `easypay/src/app/pay/preview.tsx`
> (§ 9.2). Décider : **la garder** (et la vérifier à l'écran), ou **l'annuler**
> (`git revert` du commit correspondant). Tant que ce n'est pas tranché, considérer
> **le paiement comme cassé**.

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

---

## 9. Deuxième session du 2026-08-04 — le parcours produit, commencé puis arrêté

Session arrêtée volontairement par l'utilisateur avant la fin. **Ce qui suit est tout ce qui
a été réellement établi.** Rien d'autre n'a été examiné.

### 9.1 Périmètre réellement couvert

| Partie | Ce qui a été fait |
|---|---|
| `(auth)` — 8 écrans | ✅ **Lus dans le code uniquement.** ❌ **Jamais vus à l'écran** : le téléphone virtuel avait déjà une inscription terminée (profil « Aya Koffi », `0787770000`, un portefeuille Wave, historique vide). Les revoir demanderait d'effacer les données de l'application — **non fait**. |
| `pay` — 11 écrans | ✅ Tous lus dans le code. ✅ **5 vus à l'écran** : coller un code, aperçu du QR, choix du portefeuille, récapitulatif, et les 4 onglets du bas. ❌ **6 jamais atteints** (attente, redirection, réussite, échec, fonds insuffisants, saisie du montant) — bloqués par 9.2. |
| `(app)` — 24 écrans | ❌ **Non examinés.** Seuls les 4 onglets ont été vus de l'extérieur. |

### 9.2 🚨 LE BLOCAGE : on ne peut pas payer

✅ **VÉRIFIÉ À L'ÉCRAN**, capture à l'appui, attente de 15 s pour écarter un simple délai.

**Quand le QR du commerçant porte déjà son montant — le cas le plus courant chez un
commerçant — l'écran « Récapitulatif » tourne dans le vide sans fin.** Le paiement ne peut
jamais aboutir.

**Cause, lue dans le code :** l'aperçu du QR saute l'écran « Combien veux-tu payer ? »
puisque le montant est déjà connu ([preview.tsx:48](easypay/src/app/pay/preview.tsx)) — or
c'est **cet écran sauté** qui était le seul à ranger le montant dans le panier
(`setAmount`). Le récapitulatif attend donc un montant qui n'arrivera jamais
([recap.tsx:23](easypay/src/app/pay/recap.tsx)). Conséquence en cascade : même en passant
outre, `waiting.tsx` paierait **0 FCFA** (`amountFcfa ?? 0`).

**Une correction est écrite** dans `preview.tsx` : recopier le montant du QR dans le panier
avant de passer au choix du portefeuille.

| Statut de cette correction | |
|---|---|
| Cohérence du code (`npx tsc --noemit`) | ✅ **PASSE** — 0 erreur |
| Preuve à l'écran | ❌ **AUCUNE.** Le serveur d'écrans **n'a pas rechargé** la modification avant l'arrêt (aucun `Android Bundled` après la modification dans le journal Metro). |

> **À dire tel quel : 1 sur le code écrit, 0 sur la preuve.** Ne jamais présenter cette
> correction comme fonctionnelle. La première chose à faire si on y revient : relancer le
> parcours et **regarder l'écran**.

### 9.3 🚨 Le code secret ne sert à rien

📋 **DÉDUIT du code** (recherche sur tout `easypay/src/`) : la fonction qui vérifie le code
secret (`verifyPin`) **n'est appelée nulle part**. Le code est créé, rangé sous forme
d'empreinte — puis **plus jamais demandé** : ni pour ouvrir l'application, ni pour confirmer
un paiement.

Deux écrans le promettent pourtant noir sur blanc :
- `pin-create` : « Ce code à 4 chiffres te servira à ouvrir EasyPay **et à confirmer tes
  paiements**. »
- `consent` : « Avant chaque paiement, EasyPay te demandera **toujours** ton accord. »

C'est un écart entre la promesse faite à l'utilisateur et ce que fait l'application.
**Non corrigé.**

### 9.4 Dette — observations hors mission, consignées sans traitement

Aucune n'a été corrigée. Aucune n'a été creusée. Elles sont notées pour ne pas être
redécouvertes une troisième fois.

| Où | Constat | Statut |
|---|---|---|
| Scanner | Après **un** scan, la caméra ne rescanne plus jamais tant que l'application n'est pas relancée (le verrou anti-double-scan n'est jamais relâché). | 📋 DÉDUIT du code |
| « Coller un code » | L'écran existe et fonctionne, mais **aucun bouton de l'application n'y mène**. Atteint uniquement par lien direct. | ✅ VÉRIFIÉ (code + écran) |
| Historique | « **Sorry! No data found** » — en anglais. | ✅ VÉRIFIÉ à l'écran |
| Historique | Le titre et le bouton « Filtrer » sont **écrasés par l'heure et les icônes** du téléphone (marge haute non respectée). | ✅ VÉRIFIÉ à l'écran |
| Compte | « **Language** », « **Theme** », « **System** » — en anglais. | ✅ VÉRIFIÉ à l'écran |
| Compte / Portefeuilles | Le numéro est **en clair** sur Compte, **masqué** ailleurs — et masqué de **deux façons différentes** (`07 ** ** 00 00` puis `••••••0000`). | ✅ VÉRIFIÉ à l'écran |
| Portefeuilles | Le titre « Mes portefeuilles » est écrit **deux fois** (barre du haut + page). Même défaut sur « Coller un code ». | ✅ VÉRIFIÉ à l'écran |
| Portefeuilles | **Aucun solde affiché.** Or choisir son portefeuille est le cœur du produit, et le solde est l'information qui permet de choisir. | ✅ VÉRIFIÉ à l'écran |
| Choix du portefeuille | « **Wave · Wave** » répété (le surnom reprend le nom de l'opérateur). | ✅ VÉRIFIÉ à l'écran |
| Choix du portefeuille | **Le montant à payer n'est plus visible** au moment de choisir avec quoi payer. | ✅ VÉRIFIÉ à l'écran |
| Aperçu du QR | **Pas de bouton « Annuler »** sur un écran de paiement. | ✅ VÉRIFIÉ à l'écran |
| Barre du bas | L'icône de « Scanner » est une **maison** ; celle de « Portefeuilles » est un caractère `◫`, visuellement étranger aux autres. | ✅ VÉRIFIÉ à l'écran |
| Scanner | Bouton « Historique » en haut à droite, **alors qu'un onglet Historique existe déjà** en bas. | ✅ VÉRIFIÉ à l'écran |
| Inscription | Le code secret accepte **0000** et **1234**. | 📋 DÉDUIT du code |
| Inscription | La date de naissance est un texte libre : **ni format contrôlé, ni âge minimum**. | 📋 DÉDUIT du code |
| Inscription | Conditions d'utilisation et politique de confidentialité : **texte vide** (« bientôt disponible »). | 📋 DÉDUIT du code |
| Inscription | La « vérification d'identité » demande le **type** de pièce, mais **ni numéro ni photo** : elle ne vérifie rien. Elle se déclare « vérifiée » après 3 secondes. | 📋 DÉDUIT du code |
| Inscription | Si l'application est fermée pendant la vérification, l'écran peut rester bloqué **sans aucune sortie** (pas de bouton retour). | 📋 DÉDUIT du code |
| Frais | Le récapitulatif annonce « Total débité = montant + frais », mais la simulation ne compare **que le montant** au solde. | 📋 DÉDUIT du code |

### 9.5 Faits d'exploitation utiles (gain de temps la prochaine fois)

| Fait | Détail |
|---|---|
| `adb` **n'est pas** dans le chemin système | Utiliser `"$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"`. Idem pour `emulator.exe`. |
| Tester Metro | `http://localhost:8081/status` **échoue** depuis PowerShell ; `http://127.0.0.1:8081/status` **fonctionne**. |
| Ouvrir un écran précis | Liens directs actifs, schéma **`easypay://`**. Exemple qui marche : `adb shell am start -a android.intent.action.VIEW -d "easypay://pay/manual-entry"`. |
| Injecter un QR sans caméra | Écran « Coller un code » + `adb shell input text "<chaîne EMVCo>"`. La frappe prend ~10 s : **attendre avant de capturer l'écran**. |
| QR de test qui marche | `00020101021126290010A0000000010111MERCHANT1235303952540415005802CI5907CHEZAYA6007ABIDJAN63041D3A` → « CHEZAYA, 1 500 FCFA ». Pas d'espace dans le nom du commerçant, sinon la frappe casse. |
| ⚠️ Fast Refresh | **N'a pas fonctionné** sur la modification de `preview.tsx` en fin de session. Vérifier `Android Bundled` dans le journal Metro **avant** de croire qu'une modification est appliquée. |
| État du téléphone virtuel | ⚠️ **PÉRIMÉ — voir § 10.3.** Le téléphone virtuel a été reconstruit à neuf : l'inscription et le portefeuille Wave **n'existent plus**. |

---

## 10. Troisième session du 2026-08-04 — ressources du poste

### 10.1 La contrainte physique est la MÉMOIRE, pas le processeur

✅ VÉRIFIÉ, mesuré sur le poste :

| | |
|---|---|
| Mémoire vive totale | **7,81 Go** |
| Processeur | Intel i5-10400T, **6 cœurs / 12 fils**, occupé à **13–16 %** même en pleine charge |
| Mémoire engagée, EasyPay en marche | **23,69 Go** — soit **3 fois** la mémoire physique |

**Le processeur n'est jamais saturé. C'est la mémoire qui manque.** Toute optimisation
qui gagne du processeur en dépensant de la mémoire va dans le mauvais sens ici.

Poids réels, EasyPay complet en marche (engagé / réellement en mémoire) :

| Poste | Engagé | En mémoire |
|---|---|---|
| Émulateur (`qemu`) | **4 335 Mo** | 1 162 Mo |
| Claude (17 processus, **4 sessions ouvertes**) | **4 362 Mo** | 809 Mo |
| Chrome | 2 793 Mo | 397 Mo |
| Metro + node | 2 011 Mo | 768 Mo |
| Docker/WSL | 997 Mo | 140 Mo |

> **Une seule session Claude Code doit rester ouverte quand on travaille sur EasyPay.**
> Chaque session en trop coûte ≈ 0,55 Go. C'est le levier le plus rentable côté utilisateur.

### 10.2 Ce qui a été changé, et où ça vit

| Quoi | Où | Valeur |
|---|---|---|
| Plafond de Docker/WSL | `C:\Users\VAYA DIOMANDE\.wslconfig` **(hors dépôt, non versionné)** | `memory=2GB`, `processors=4`, `swap=1GB`, `vmIdleTimeout=60000` |
| Metro | `easypay/metro.config.js` (versionné) | `maxWorkers = 2` (était 3) |

Sans `.wslconfig`, Windows applique le défaut documenté par Microsoft : la machine virtuelle
Linux se réserve **50 % de la mémoire du PC** (3 819 Mo) et **tous les processeurs** (12),
alors qu'elle ne fait tourner qu'un seul petit conteneur. Elle est passée à **1 904 Mo et
4 processeurs**. Pour annuler : supprimer le fichier puis `wsl --shutdown`.

❌ **Aucune exclusion antivirus n'a été appliquée.** La commande a été bloquée par la
sécurité, puis l'utilisateur a demandé de ne pas y revenir. Kaspersky **et** Windows
Defender restent tous deux actifs en temps réel.

### 10.3 🚨 INCIDENT — le téléphone virtuel a disparu, cause inconnue

Pendant la session, le dossier `C:\Users\VAYA DIOMANDE\.android\avd\` (2,7 Go) **a disparu
entièrement** entre deux démarrages de l'émulateur.

| | |
|---|---|
| Cause | ❓ **INCONNUE ET NON RÉSOLUE.** Aucune commande de la session ne visait ce dossier ; aucun journal Windows, Defender ou Kaspersky ne montre de suppression. |
| Piste non confirmée | Deux antivirus temps réel cohabitent, et un balayage Defender a eu lieu à 19:30. Aucune preuve. |
| Réparation | ✅ AVD **reconstruit à l'identique** depuis une sauvegarde du `config.ini` prise en début de session. L'image système (2,05 Go) était intacte : aucun téléchargement. |
| Perte définitive | ❌ **Les données du téléphone.** L'inscription « Aya Koffi » et le portefeuille Wave **n'existent plus**. Effet de bord utile : les 8 écrans `(auth)` sont de nouveau atteignables. |
| Risque résiduel | ⚠️ **Peut se reproduire.** Parade appliquée : sauvegarder `config.ini` avant toute manipulation de l'AVD. Ce fichier suffit à tout reconstruire en ~2 minutes. |

### 10.4 Le piège qui déguisait tout le reste

Après un plantage, l'émulateur **conserve le rapport et attend un clic sur une boîte de
dialogue** avant de démarrer. Symptôme : « l'émulateur ne démarre plus », « la machine est
saturée ». Réalité : il attendait une réponse.

✅ VÉRIFIÉ : de « ne démarre jamais, 246 s » à **37 s**, après suppression des rapports en
attente et ajout de `-no-metrics`.

> **À mettre dans la boucle quotidienne : lancer l'émulateur avec `-no-metrics`.**
> Et si l'émulateur « ne démarre plus », vider
> `%LOCALAPPDATA%\Temp\AndroidEmulator\*.dmp` **avant** de soupçonner la mémoire.
> C'est le cinquième symptôme de ce poste dont la cause n'a rien à voir avec l'apparence.

### 10.5 État fonctionnel après reconstruction — ✅ VÉRIFIÉ

| Preuve | Résultat |
|---|---|
| `emulator -list-avds` | `Pixel_8_API_35` |
| Démarrage à froid | ✅ 104 s (première initialisation ; 37 s ensuite) |
| Play Services re-désactivés | ✅ `com.android.vending`, `com.google.android.gms` en `disabled-user` |
| APK réinstallé | ✅ `app-debug.apk` 80,4 Mo, `Success` |
| Bundle Metro | ✅ 6 324 Ko en 18 s (cache chaud, émulateur au repos) |
| Application chargée | ✅ `topResumedActivity = com.easypay.development/.MainActivity` |
| Écran | ✅ capture : « EasyPay — Ton portefeuille, tous tes moyens de paiement » |
| Conteneur du 2e projet | ✅ `homarr-redis` en marche |

### 10.6 L'ordre de démarrage compte

✅ VÉRIFIÉ : l'émulateur a été **tué par manque de mémoire deux fois** quand Metro compilait
en même temps. La séquence qui passe :

1. Lancer Metro,
2. **préchauffer le bundle émulateur éteint** —
   `http://127.0.0.1:8081/node_modules/expo-router/entry.bundle?platform=android&dev=true&transform.bytecode=1&transform.engine=hermes`,
3. **puis** démarrer l'émulateur.

Les deux pics ne se superposent plus.
