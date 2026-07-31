# EasyPay — guide de passation (état au 31 juillet 2026)

Ce fichier est le point d'entrée unique pour reprendre le projet **EasyPay**
(le lecteur de QR de paiement universel). Il ne concerne pas `docengine/` —
c'est un projet à part qui vit dans ce même dépôt, sur la branche
`claude/universal-qr-code-reader-4cdw9s`.

## En une phrase

Une appli mobile qui scanne n'importe quel QR de paiement mobile money
(Wave, Orange Money…), reconnaît automatiquement à qui il appartient, et
ouvre directement la bonne appli pour terminer le paiement — sans jamais
demander à l'utilisateur laquelle choisir.

## Il existe deux dossiers, volontairement

| Dossier | Ce que c'est | État |
|---|---|---|
| `mobile_qr_payer/` | **v0** — le premier prototype, construit à la main (React Native Paper) | Complet, testé (22 tests), jamais éprouvé sur un vrai téléphone |
| `easypay/` | **v0.1** — le même moteur, réimplanté dans un vrai squelette d'appli gratuit et open source ([Obytes Starter](https://starter.obytes.com)) : navigation, réglages, thème clair/sombre déjà fournis | Complet, testé (22 tests), jamais éprouvé sur un vrai téléphone |

**Recommandation** : partir de `easypay/` pour la suite (plus solide, plus
simple à faire évoluer). `mobile_qr_payer/` est gardé pour l'instant comme
filet de sécurité, le temps de valider `easypay/` sur un vrai téléphone —
à supprimer ensuite pour ne pas maintenir deux projets en parallèle.

## Ce qui marche, vérifié

- Le moteur de reconnaissance (`src/core/` dans chaque dossier, identique
  dans les deux) : lecture du format standard EMVCo, reconnaissance Wave
  (confirmée — les QR Wave contiennent un vrai lien officiel), reconnaissance
  Orange Money par heuristique (nom du marchand), 22 tests automatiques verts.
- Écran d'accueil (une seule fois), lecteur caméra, écran de résultat,
  historique local des scans, réglages (langue, thème).
- Identité visuelle propre (icône bleu nuit + or, voir `mobile_qr_payer/assets/icon.png`).
- Vérifié par captures d'écran de l'appli qui tourne réellement (navigateur,
  caméra factice) — jamais encore sur un vrai téléphone avec un vrai QR.

## Ce qui reste (voir aussi les README de chaque dossier)

1. Le vrai test sur téléphone (bloqué : demande un ordinateur + Wi-Fi, pas
   accessible depuis cet atelier cloud).
2. Confirmer la reconnaissance Orange Money avec un vrai QR.
3. Ajouter MTN Money / Moov Money quand on a un exemple réel de chacun.
4. Choisir entre `mobile_qr_payer/` et `easypay/` et supprimer l'autre.
5. Le vrai débit automatique (au lieu d'ouvrir l'appli officielle) demande un
   accord commercial avec un agrégateur agréé BCEAO — pas du code.

## Comment lancer chaque version

```sh
# v0
cd mobile_qr_payer && npm install && npm start

# v0.1 (recommandé)
cd easypay && pnpm install && pnpm start
```

Puis scanner le QR affiché dans le terminal avec l'appli **Expo Go**
(gratuite, Play Store/App Store).

## Historique des décisions importantes

- QR codes de paiement testés sans dispositif spécial : le format Wave est
  une simple URL (`pay.wave.com/...`), le format Orange Money suit le
  standard ouvert EMVCo — vérifié par recherche, pas supposé.
- Un débit automatique direct (sans passer par l'appli officielle de
  l'opérateur) est impossible sans agrément BCEAO d'agrégateur de paiement —
  vérifié, ce n'est pas un choix technique.
- `react-native-paper` puis un squelette d'appli complet (Obytes Starter)
  ont été adoptés à la demande explicite de partir de briques déjà faites
  plutôt que de tout redessiner à la main.
