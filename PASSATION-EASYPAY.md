# EasyPay — guide de passation (état au 1er août 2026)

Ce fichier est le point d'entrée unique pour reprendre le projet **EasyPay**.
Il ne concerne pas `docengine/` — c'est un projet à part qui vit dans ce même
dépôt, sur la branche `claude/universal-qr-code-reader-4cdw9s`.

## En une phrase

Un portefeuille de paiement universel. On lie ses portefeuilles mobile money
(Wave, Orange Money, Push by PalmPay, Djamo...), on scanne n'importe quel QR
marchand, et on choisit soi-même avec quel portefeuille on paie — peu importe
l'opérateur du QR scanné. EasyPay orchestre le paiement et prélève une petite
commission ; il ne détient jamais l'argent (statut visé : "Service
d'Initiation de Paiement", catégorie créée par la BCEAO en janvier 2024 — pas
une hypothèse, 9 entreprises sont déjà agréées en Côte d'Ivoire sous ce cadre,
dont Djamo).

## Historique du projet (pourquoi deux dossiers existent)

| Dossier | Ce que c'est | État |
|---|---|---|
| `mobile_qr_payer/` | **V0/V1** — premier prototype : lit un QR, ouvre l'appli correspondante. Construit à la main. | Complet, testé, dépassé par la V2 |
| `easypay/` | **V2 (actuelle)** — le vrai produit : portefeuille universel avec identité vérifiée, plusieurs wallets liés, choix de la source de paiement, historique, commission visible. 47 écrans. | Complet, testé de bout en bout, jamais éprouvé sur un vrai téléphone |

**Recommandation** : `easypay/` est la version à faire avancer. `mobile_qr_payer/`
peut être supprimé dès que quelqu'un le confirme — il ne représente plus la
vision du produit.

## Ce qui marche, vérifié

- Le moteur de reconnaissance des QR (Wave confirmé, Orange Money par heuristique
  EMVCo) : 18 tests automatiques verts.
- **47 écrans construits et reliés entre eux**, en 6 parcours : démarrage &
  identité, portefeuilles, scanner & payer, historique, compte, réglages.
- Un vrai parcours automatisé de bout en bout a été rejoué (25 captures
  d'écran réelles) : inscription complète → identité vérifiée → ajout d'un
  portefeuille Wave → scan d'un QR marchand → paiement avec ce portefeuille,
  commission affichée clairement → confirmation → retour à l'accueil.
- Le moteur qui orchestre le paiement (débiter/créditer) est **simulé, mais
  honnêtement documenté comme tel** dans le code, avec l'endroit précis où
  brancher un vrai fournisseur plus tard sans toucher aux écrans.

## Ce qui reste

1. **Aucun vrai débit d'argent** — c'est simulé. Brancher un vrai fournisseur
   (agrégateur agréé, ou accords un par un avec Wave/Orange Money/Djamo...)
   est une étape commerciale, pas seulement technique.
2. Le vrai test sur téléphone (bloqué depuis cet atelier cloud : demande un
   ordinateur + Wi-Fi).
3. ~~Sécuriser le code secret~~ — fait le 1er août 2026 : il n'est plus jamais stocké
   en clair (empreinte SHA-256 + sel). Reste, un jour, à le loger dans un vrai coffre
   système (`expo-secure-store`) plutôt que le stockage local classique.
4. Confirmer la reconnaissance Orange Money avec un vrai QR ; ajouter MTN
   Money / Moov Money.
5. Décider de la suite pour `mobile_qr_payer/` (garder comme référence ou
   supprimer).

## Comment lancer

```sh
cd easypay && pnpm install && pnpm start
```

Puis scanner le QR affiché dans le terminal avec l'appli **Expo Go** (gratuite,
Play Store/App Store).

## Historique des décisions importantes

- QR Wave = une simple URL (`pay.wave.com/...`) ; QR Orange Money = standard
  ouvert EMVCo — vérifié par recherche, pas supposé.
- Le mécanisme "je paie avec le wallet de mon choix, peu importe le QR scanné"
  correspond à une vraie catégorie réglementaire de la BCEAO ("Service
  d'Initiation de Paiement", instruction n°001-01-2024) — EasyPay ne détient
  jamais l'argent, il le fait juste transiter, contre une petite commission.
  Vérifié via BCEAO et la liste officielle des établissements de paiement
  agréés en Côte d'Ivoire (Djamo, CinetPay, Julaya... y figurent déjà).
- `react-native-paper` puis un squelette d'appli complet (Obytes Starter) ont
  été adoptés pour partir de briques déjà faites plutôt que tout redessiner à
  la main.
- La V2 (portefeuille universel à 47 écrans) remplace la V0/V1 (simple lecteur
  qui redirige) suite à une clarification du besoin réel : l'utilisateur veut
  choisir sa source de paiement, pas juste être redirigé vers l'appli du QR
  scanné.
