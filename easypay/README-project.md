<h1 align="center">
  <img alt="logo" src="./assets/icon.png" width="124px" style="border-radius:10px"/><br/>
EasyPay — v0.1 </h1>

> Construit à partir d'un vrai squelette d'appli ([Obytes Starter](https://starter.obytes.com)),
> pour ne pas repartir de zéro sur la navigation, l'accueil, les réglages...

## Ce que fait EasyPay

Une appli qui s'ouvre directement sur un lecteur de QR code. Elle scanne un QR de
paiement, reconnaît tout de suite à quel opérateur il appartient (Wave, Orange
Money…), et ouvre automatiquement la bonne appli officielle.

## Ce qui marche déjà (vérifié)

- Le moteur de reconnaissance (`src/core/`) est le même que celui déjà testé dans
  `mobile_qr_payer/` — 22 tests automatiques, tous verts (`pnpm test`).
- 3 onglets fonctionnels : **Scanner** (caméra), **Historique** (relevé des scans),
  **Réglages** (langue, thème clair/sombre — déjà fournis par le modèle de départ).
- Écran d'accueil affiché une seule fois au premier lancement.
- Identité visuelle EasyPay (icône, couleurs) déjà en place.
- Vérifié par une vraie capture d'écran de l'appli qui tourne (pas une maquette).

## Ce qui reste (honnête, pas caché)

- **4 tests hérités du modèle de départ échouent** (`button.test.tsx`,
  `select.test.tsx`, `input.test.tsx`, `checkbox.test.tsx`) — un souci connu de
  l'écosystème React Native (une dépendance de navigation livrée dans un format que
  l'outil de test ne sait pas encore lire). Ça ne touche ni notre moteur ni l'appli
  réelle (qui tourne très bien), seulement ces tests précis. À corriger plus tard.
- Le texte "Sorry! No data found" de l'historique vide vient du modèle de départ,
  pas encore traduit en français.
- La connexion (login) du modèle de départ a été retirée : EasyPay ne demande pas de
  compte.

## Comment le lancer

```sh
pnpm install
pnpm start   # puis scanner le QR avec l'appli Expo Go
# ou
pnpm web     # prévisualiser dans un navigateur
```

## Repères techniques

- `src/core/` : le moteur (identique à `mobile_qr_payer/src/core/`).
- `src/storage/appState.ts` : historique des scans (stockage local MMKV, déjà fourni
  par le modèle de départ).
- `src/features/scanner/`, `src/features/history/` : nos écrans.
- `src/app/(app)/` : les routes (navigation par fichiers, fournie par Expo Router).
- `src/components/ui/colors.js` + `src/global.css` : les couleurs EasyPay (les deux
  fichiers doivent rester alignés, Tailwind v4 lit `global.css`).
