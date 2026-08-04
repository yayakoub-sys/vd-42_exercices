# CARTE — quoi lire, dans quel ordre, et à quoi ne pas se fier

**À jour au 2026-08-04.** Ce dépôt a accumulé beaucoup de documents de passation au fil des
sessions. Plusieurs se contredisent. Cette carte dit lequel fait foi.

---

## 1. Démarrage d'une session — 4 fichiers, 5 minutes

Dans cet ordre, et rien d'autre au début :

| Ordre | Fichier | Ce qu'il donne |
|---|---|---|
| 1 | [CLAUDE.md](CLAUDE.md) | Comment travailler ici. Se charge tout seul. |
| 2 | [ETAT.md](ETAT.md) | Où en est le travail, ce qui est cassé, ce qui attend une décision. |
| 3 | **CARTE.md** (ce fichier) | Quoi lire ensuite selon la tâche. |
| 4 | [GATE.md](GATE.md) | Ce qu'il faut vérifier avant et après d'agir. |

**Ne pas lire les autres documents « au cas où ».** Ils sont volumineux et partiellement
périmés. Y aller seulement quand la tâche l'exige (§ 3).

---

## 2. Ce qui fait foi, et ce qui ne fait plus foi

### ✅ Fait foi

| Document | Portée |
|---|---|
| [ETAT.md](ETAT.md) | **L'état réel.** Prime sur tout autre document en cas de contradiction. |
| [easypay/BOUCLE-ANDROID.md](easypay/BOUCLE-ANDROID.md) | La boucle de développement Android, en français non technique. Vérifiée de bout en bout. |
| [easypay/CLAUDE.md](easypay/CLAUDE.md) | Les règles de code d'EasyPay + la section Android. |
| Mémoire froide (hors dépôt) | Voir § 4. |

### ⚠️ Partiellement périmé — lire avec la correction en tête

| Document | Ce qui est encore bon | Ce qui est FAUX |
|---|---|---|
| [DOSSIER_REPRISE_EASYPAY.md](DOSSIER_REPRISE_EASYPAY.md) — 1041 lignes | L'audit du code, l'historique des commits, les statuts FAIT PROUVÉ / DÉDUCTION. Le document le plus sérieux du dépôt. | Tout ce qui concerne Android d'avant le 2026-08-04. L'écart « 47 écrans » qu'il laisse ouvert **est tranché : 44**. |
| [PASSATION-EASYPAY.md](PASSATION-EASYPAY.md) — 83 lignes | La description du produit en une phrase, les portefeuilles visés. | Annonce **47 écrans** : c'est **44**. État au 1er août, donc antérieur à tout le travail Android. |
| [README.md](README.md), [GUIDE.md](GUIDE.md), [PASSATION.md](PASSATION.md) | La description de **docengine**, qui n'a pas changé. | ⚠️ **Ces trois fichiers ne parlent PAS d'EasyPay.** Ils décrivent le moteur de documents. Ne pas les lire en croyant lire EasyPay. |

### ❌ Ne fait plus foi du tout

- **L'ancienne section « atelier cloud / PC invisible »** de `CLAUDE.md`. Claude s'exécute
  maintenant sur le PC et voit `C:` comme `H:`. Corrigé.
- **La règle « ne pas modifier `android/` »** héritée du modèle Obytes, qui était encore dans
  `easypay/CLAUDE.md`. `android/` est désormais une **source versionnée**. Corrigé.
- **Le contrôle « lancer `python -m pytest tests/ -q` avant un commit »**. `pytest` n'est pas
  installé sur ce poste. Corrigé dans [GATE.md](GATE.md).
- `easypay/LANCER-EASYPAY-TELEPHONE.bat` — **supprimé** : il visait l'AVD effacé et passait
  par Expo Go, c'est-à-dire un second environnement Android en parallèle. Reste dans
  l'historique git (commit `7fa0a45`) si besoin.

---

## 3. Où aller selon la tâche

### « Je reprends EasyPay et je veux le voir tourner »

1. [easypay/BOUCLE-ANDROID.md](easypay/BOUCLE-ANDROID.md) — la boucle en 3 étapes.
2. [GATE.md](GATE.md) § avant de lancer l'émulateur.
3. Rien d'autre.

### « Je travaille sur les écrans / le produit »

1. [PASSATION-EASYPAY.md](PASSATION-EASYPAY.md) § « En une phrase » — ce que le produit doit faire.
2. [DOSSIER_REPRISE_EASYPAY.md](DOSSIER_REPRISE_EASYPAY.md) — l'audit détaillé, en sautant tout ce qui touche à Android.
3. Le code : `easypay/src/app/` (**44 écrans**), `easypay/src/features/`, `easypay/src/components/ui/`.
4. [easypay/CLAUDE.md](easypay/CLAUDE.md) — conventions (imports `@/`, TanStack Form, MMKV, structure par feature).

### « Le build Android est cassé »

1. Mémoire froide `correctifs-build-android-easypay.md` — les cinq correctifs et pourquoi.
2. Mémoire froide `poste-android-easypay.md` — les trois contraintes du poste.
3. Mémoire froide `play-services-plante-emulateur-api35.md` — **à lire en premier si le
   symptôme est un délai dépassé ou un écran blanc.**
4. Les correctifs eux-mêmes sont **commentés dans les fichiers** : `easypay/.npmrc`,
   `easypay/android/build.gradle`, `easypay/android/fix-canonical-prefixes.cmake`,
   `easypay/android/app/build.gradle`, `easypay/android/gradle.properties`.

### « Je reprends docengine »

1. [README.md](README.md) — ce que fait le moteur.
2. [GUIDE.md](GUIDE.md) — le lancer, version non technique.
3. [PASSATION.md](PASSATION.md) — l'historique du projet.
4. ⚠️ Installer d'abord les dépendances : voir [GATE.md](GATE.md) § docengine.

---

## 4. La mémoire froide (hors dépôt)

Elle vit dans le dossier de mémoire de Claude, **pas dans git**. Elle survit aux sessions mais
pas à une réinstallation.

`…\.claude\projects\C--Users-VAYA-DIOMANDE-Travail-vd-42-exercices\memory\`

| Fiche | Contenu |
|---|---|
| `MEMORY.md` | L'index. Chargé à chaque session. |
| `reprise_20260804-170000.json` | **La fiche de reprise à jour.** |
| `poste-android-easypay.md` | Les trois contraintes du poste Windows. |
| `correctifs-build-android-easypay.md` | Les cinq correctifs + la boucle de développement. |
| `play-services-plante-emulateur-api35.md` | La panne Google qui se déguise en machine lente. |
| `reprise_20260804-152500.json` | Périmée, remplacée. |
| `reprise_20260803-131748.json` | Conservée pour l'inventaire des routes. |

---

## 5. Carte du code

```
vd-42_exercices/
├── CLAUDE.md   ETAT.md   CARTE.md   GATE.md      ← les 4 fichiers de pilotage
│
├── easypay/                                       🔨 CHANTIER EN COURS — 280 fichiers
│   ├── BOUCLE-ANDROID.md                          ← la boucle quotidienne
│   ├── src/app/                                   ← 44 écrans : (app) 24, pay 11, (auth) 8
│   ├── src/features/                              ← modules métier
│   ├── src/components/ui/                         ← briques d'interface (1 test échoue ici)
│   ├── src/lib/                                   ← api, auth, i18n, stockage MMKV
│   ├── android/                                   ← ⚠️ SOURCE VERSIONNÉE, jamais régénérer
│   │   ├── build.gradle                           ← correctif 260 caractères
│   │   ├── fix-canonical-prefixes.cmake           ← correctif -lc++ manquant
│   │   ├── app/build.gradle                       ← correctif chemin C++ court
│   │   └── gradle.properties                      ← x86_64 seul (émulateur)
│   ├── .npmrc                                     ← node-linker=hoisted
│   ├── metro.config.js                            ← maxWorkers = 3, bouchons Expo Go
│   └── shims/                                     ← bouchons JS (EXPO_PUBLIC_GO=1)
│
├── docengine/  web/  templates/  tests/           ⏸️ EN PAUSE — moteur de documents Python
│   └── README.md  GUIDE.md  PASSATION.md          ← ⚠️ ces docs parlent d'ICI, pas d'EasyPay
│
└── mobile_qr_payer/                               📦 ANTÉRIEUR — 39 fichiers, cœur EMVCo
```

---

## 6. Hors du dépôt, mais indispensable

| Emplacement | Rôle |
|---|---|
| `C:\Users\VAYA DIOMANDE\.android\avd\Pixel_8_API_35.avd\` | **Le seul émulateur.** Contient aussi les réglages Play Services désactivé. |
| `C:\Users\VAYA DIOMANDE\.android\advancedFeatures.ini` | Démarrage rapide désactivé (`FastSnapshotV1 = off`). |
| `C:\Users\VAYA DIOMANDE\AppData\Local\Android\Sdk` | Le SDK Android **actif**. |
| `H:\ANDROID_WORKSPACE\gradle` | Cache Gradle (`GRADLE_USER_HOME`). |
| `H:\ANDROID_WORKSPACE\sdk` | Copie du SDK, **vérifiée mais NON active**. Décision en attente. |
| `C:\cxx-easypay` | Répertoire de travail C++ du module `:app`. Reconstructible. |
| `%TEMP%\metro-cache` | Cache de Metro. ⚠️ Ne pas vider le dossier Temp. |
| `easypay/android/.idea/` | Ignoré par git, contient `gradleJvm=jbr-21`. S'il est perdu, Android Studio risque de retomber sur le JBR 25, que Gradle 8.14.3 refuse. |
