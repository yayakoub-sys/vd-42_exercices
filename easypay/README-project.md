<h1 align="center">
  <img alt="logo" src="./assets/icon.png" width="124px" style="border-radius:10px"/><br/>
EasyPay — V2 </h1>

> Construit à partir d'un vrai squelette d'appli ([Obytes Starter](https://starter.obytes.com)),
> pour ne pas repartir de zéro sur la navigation, l'accueil, les réglages...

## Ce que fait EasyPay

Un portefeuille de paiement universel. Tu lies tes portefeuilles mobile money (Wave,
Orange Money, Push by PalmPay, Djamo...), tu scannes n'importe quel QR de paiement
marchand, et tu choisis toi-même avec quel portefeuille tu payes — peu importe
l'opérateur du QR scanné. EasyPay orchestre un débit direct de la source choisie vers
le commerçant et prélève une petite commission au passage. Il ne détient jamais ton
argent (statut réglementaire visé : "Service d'Initiation de Paiement", une catégorie
définie par la BCEAO depuis janvier 2024 — voir `PASSATION-EASYPAY.md` à la racine du
dépôt pour le détail).

## Ce qui marche déjà (vérifié)

- Le moteur de reconnaissance des QR (`src/core/emvco.ts`, `src/core/providers/`) est
  le même que celui déjà testé dans `mobile_qr_payer/` — 18 tests automatiques, tous
  verts (`pnpm test`).
- **47 écrans construits**, répartis en 6 parcours : démarrage & identité (9),
  portefeuilles (10), scanner & payer (12), historique (5), compte (5), réglages (6).
- Testé de bout en bout par un vrai parcours automatisé (pas une maquette) : accueil →
  téléphone → code SMS → code secret → consentement → informations → identité vérifiée
  → écran d'accueil → ajout d'un portefeuille Wave → paiement d'un QR scanné avec ce
  portefeuille (récapitulatif avec la commission affichée) → confirmation. Tout
  fonctionne, capturé en 25 captures d'écran réelles.
- Moteur de paiement **simulé mais honnête** : voir `src/core/wallet-engine/mockBackend.ts`
  — chaque fonction est commentée clairement "SIMULATION", avec l'endroit exact où
  brancher le vrai appel réseau plus tard, sans toucher aux écrans.

## Ce qui reste (honnête, pas caché)

- **Aucun vrai débit d'argent** : tout le moteur (`mockBackend.ts`) est simulé. Brancher
  un vrai fournisseur (agrégateur, ou accords un par un) est une étape commerciale, pas
  seulement technique.
- **4 tests hérités du modèle de départ échouent** (`button.test.tsx`,
  `select.test.tsx`, `input.test.tsx`, `checkbox.test.tsx`) — un souci connu de
  l'écosystème React Native (une dépendance de navigation livrée dans un format que
  l'outil de test ne sait pas encore lire). Sans effet sur notre moteur ni sur l'appli
  réelle.
- Le code secret (PIN) est stocké en clair dans le stockage local pour l'instant — noté
  explicitement dans `src/storage/authState.ts`. À sécuriser (`expo-secure-store`)
  avant toute vraie mise en production.
- Le texte "Sorry! No data found" (historique vide) et quelques infobulles viennent du
  modèle de départ, pas encore traduits en français.
- Jamais testé sur un vrai téléphone (seulement en navigateur, avec caméra factice).

## Comment le lancer

```sh
pnpm install
pnpm start   # puis scanner le QR avec l'appli Expo Go
# ou
pnpm web     # prévisualiser dans un navigateur
```

## Repères techniques

- `src/core/` : le moteur de reconnaissance QR (identique à `mobile_qr_payer/src/core/`).
- `src/core/wallet-engine/` : types, registre des opérateurs, moteur de paiement simulé,
  état temporaire d'un paiement en cours (`paymentDraftStore.ts`).
- `src/storage/` : `walletsState.ts` (portefeuilles liés), `authState.ts` (téléphone,
  code secret), `kycState.ts` (identité), `transactionsState.ts` (historique des
  paiements) — tout en local (MMKV), rien envoyé ailleurs.
- `src/app/(auth)/` : démarrage & identité. `src/app/(app)/wallets/`,
  `src/app/(app)/history/`, `src/app/(app)/account/` : les 3 autres parcours dans
  l'onglet correspondant. `src/app/pay/` : le parcours scanner & payer (lancé depuis
  l'onglet Scanner).
- `src/components/ui/colors.js` + `src/global.css` : les couleurs EasyPay (les deux
  fichiers doivent rester alignés, Tailwind v4 lit `global.css`).
