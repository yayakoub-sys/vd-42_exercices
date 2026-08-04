# EasyPay sur Android — la boucle de travail quotidienne

Ce fichier décrit **la seule et unique façon** de faire tourner EasyPay sur
Android sur ce poste. Il n'y a pas d'autre chemin, pas d'autre émulateur, pas
d'autre environnement.

Vérifié de bout en bout le 2026-08-04 : démarrage, chargement, Fast Refresh et
navigation entre écrans.

---

## Ce que tu as

| | |
|---|---|
| **Un seul téléphone virtuel** | `Pixel 8 API 35` — un téléphone Android standard et moderne (1080 × 2400, Android 15), piloté depuis Android Studio. |
| **Un seul programme installé dessus** | EasyPay en version « développement » (`com.easypay.development`). Il est **réutilisable** : on ne le refabrique presque jamais. |
| **Un serveur d'écrans** | Metro. C'est lui qui envoie les écrans au téléphone virtuel et qui les **remet à jour tout seul** quand tu modifies un fichier. |

Pourquoi un Pixel 8 et plus le Pixel Fold : EasyPay est un portefeuille de
paiement. Le Pixel Fold démarrait **déplié**, dans un format presque carré
(2208 × 1840) qu'aucun utilisateur d'EasyPay ne verra jamais — tous les écrans
étaient donc jugés dans un format faux. Il occupait en plus 3,6 Go sur un disque
C: à l'étroit. Le Pixel 8 montre l'application telle qu'elle sera vraiment vue.

---

## La boucle de tous les jours

### 1. Allumer le téléphone virtuel

**Android Studio** → ouvrir le dossier `easypay/android` → **Device Manager**
(icône téléphone, à droite) → bouton **▶** sur `Pixel 8 API 35`.

Compter environ **1 minute 10**. Une fois allumé, **le laisser allumé toute la
journée** : on ne paie ce démarrage qu'une fois.

### 2. Allumer le serveur d'écrans

Dans un terminal, dans le dossier `easypay` :

```bash
npx expo start --dev-client
```

Laisser cette fenêtre ouverte.

### 3. Ouvrir EasyPay sur le téléphone

Sur le téléphone virtuel, ouvrir **EasyPay**. Un écran « Development Build »
s'affiche avec, sous **DEVELOPMENT SERVERS**, une ligne `http://10.0.2.2:8081`
avec une **pastille verte**. Appuyer dessus.

> Raccourci équivalent : appuyer sur la touche **`a`** dans la fenêtre Metro.

**La toute première fois** (ou après un nettoyage du dossier Temp), Metro doit
tout compiler : compter **3 à 4 minutes**. L'application peut abandonner avant
la fin et afficher un écran rouge *« There was a problem loading the project »*.
Ce n'est pas une panne : attendre que la fenêtre Metro affiche
**`Android Bundled …`**, puis appuyer sur **Reload**. Les fois suivantes, le
chargement prend une trentaine de secondes.

### 4. Travailler

**Tu changes un écran, un texte, une couleur, une règle de calcul ?**
→ **Rien à faire.** Tu enregistres le fichier et l'écran se met à jour tout seul
sur le téléphone, en quelques secondes. C'est le *Fast Refresh*.

C'est le cas pour **tout** ce qui est dans `src/`, c'est-à-dire la quasi-totalité
du travail sur EasyPay.

---

## Quand faut-il refabriquer l'application ?

**Presque jamais.** Uniquement dans ces trois cas :

1. On **ajoute une brique Android** au projet (une bibliothèque qui accède au
   matériel : appareil photo, empreinte, paiement sans contact…).
2. On **change le nom, l'icône ou les autorisations** de l'application.
3. On **modifie un fichier de `android/`**.

Dans ces cas-là seulement : Android Studio, bouton **▶ Run**. Il reconstruit,
réinstalle et relance tout seul. Compter **environ 10 minutes**.

Ajouter une bibliothèque **purement JavaScript** ne demande **pas** de
reconstruction.

---

## Les interdits

Ces commandes **cassent le projet**. Elles refabriquent le dossier `android/` et
effacent les correctifs sans lesquels le build ne passe pas sur ce poste :

```
expo prebuild        pnpm prebuild
expo run:android     pnpm android
```

**Si c'est arrivé par accident**, rien n'est perdu — le dossier est protégé par
git. Depuis la racine du dépôt :

```bash
git checkout -- easypay/android
```

**Ne pas vider le dossier `Temp` de Windows** : Metro y garde son cache
(`%TEMP%\metro-cache`). Le supprimer fait repartir la compilation pour 3 à
4 minutes.

---

## Deux réglages faits sur le téléphone virtuel — et pourquoi

### Google Play Services est désactivé

**Ce n'est pas un caprice, c'est une panne réelle contournée.** Le Play Store
avait mis à jour Play Services en version 26.28.33, qui **plante en boucle sur
Android 15** :

```
java.lang.IllegalArgumentException: NetworkCapability 37 out of range
   at com.google.android.gms.gcm.GcmChimeraService.onCreate
```

Le processus replantait plusieurs fois par seconde, saturait le processeur du
téléphone virtuel, et **c'est ce qui faisait expirer toutes les requêtes
d'EasyPay** (`SocketTimeoutException`) et apparaître les boîtes « ne répond
pas ». EasyPay n'utilise aucun service Google : le désactiver n'enlève rien.

Ce qui a été fait (à refaire si le téléphone virtuel est un jour remis à zéro) :

```bash
adb shell pm disable-user --user 0 com.android.vending
adb shell pm disable-user --user 0 com.google.android.gms
adb shell settings put global hide_error_dialogs 1
```

Effet mesuré : de « processeur saturé, plantage en boucle » à **0 plantage et
397 % de processeur inactif**.

Pour revenir en arrière : remplacer `disable-user` par `enable`.

> **Correctif durable possible**, si tu veux t'en débarrasser proprement un
> jour : dans Android Studio, **SDK Manager → SDK Platforms → cocher « Show
> Package Details » → Android 15 → « Google APIs Intel x86_64 Atom System
> Image »** (celle **sans** Play Store), puis recréer le téléphone virtuel
> dessus. Cette image ne se met pas à jour toute seule, consomme moins de
> mémoire et n'a pas ce défaut. Coût : environ 1,5 Go à télécharger.

### Le démarrage rapide reste désactivé

Le « Quick Boot » enregistrait à chaque fermeture une photographie de toute la
mémoire du téléphone virtuel sur C:, qui avait atteint 11 Go et rempli le
disque. Le téléphone démarre donc à froid : environ 40 secondes de plus, **une
fois par jour**, contre plusieurs gigaoctets repris en permanence.

Pour revenir en arrière : supprimer
`C:\Users\VAYA DIOMANDE\.android\advancedFeatures.ini`.

---

## Si quelque chose coince

| Symptôme | Quoi faire |
|---|---|
| Écran rouge « problem loading the project », `SocketTimeoutException` | Metro compile encore. Attendre `Android Bundled …` dans la fenêtre Metro, puis **Reload**. |
| Écran rouge, `ConnectException: Failed to connect to localhost` | Utiliser la ligne `10.0.2.2:8081` de l'écran d'accueil plutôt que `localhost`. Sinon : `adb reverse tcp:8081 tcp:8081`. |
| Écran blanc qui dure | Attendre 3 minutes. Sinon appuyer sur `r` dans la fenêtre Metro. |
| Le téléphone virtuel ne démarre pas | Vérifier l'espace libre sur C: — il faut au moins 3 Go. |
| Un `▶ Run` échoue | Vérifier l'espace libre sur C: — un build complet consomme environ 3,5 Go. |
| Tout devient très lent | Fermer Android Studio pendant les compilations Metro. La machine n'a que 7,8 Go de mémoire. |

---

## Réglages choisis pour cette machine

Machine réelle : **7,8 Go de mémoire**, i5-10400T (6 cœurs basse consommation),
C: structurellement à l'étroit.

| Réglage | Valeur | Pourquoi |
|---|---|---|
| Mémoire du téléphone virtuel | 2 048 Mo | Au-delà, l'hôte n'a plus de quoi faire tourner Metro et Android Studio. |
| Cœurs du téléphone virtuel | 4 | Laisse 2 cœurs au PC. |
| `maxWorkers` de Metro | 3 | Par défaut Metro lance un processus par cœur ; la mémoire tombait à zéro et la machine permutait sur le disque — la compilation devenait **plus lente**. Réglé dans `metro.config.js`. |
| Carte SD | 512 Mo | EasyPay n'en a pas besoin. |
| Appareil photo arrière | scène virtuelle | Nécessaire pour tester le scan de QR code. |
| Image système | Android 15, x86_64, avec Play Store | La seule installée — aucun téléchargement nécessaire. |

⚠️ L'application n'est fabriquée que pour `x86_64`, l'architecture de
l'émulateur. C'est ce qui divise le temps de build par quatre. Pour une version
destinée à de vrais téléphones, remettre les quatre architectures dans
`android/gradle.properties`.
