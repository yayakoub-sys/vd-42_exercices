# DOSSIER DE REPRISE — EasyPay / Lecteur QR universel

> Document d'audit et de passation. Rédigé par lecture directe du dépôt Git, de
> l'historique des commits, du code, des tests et des configurations — **pas** à
> partir de la seule mémoire de la conversation qui a produit ce projet.
> Ce document ne concerne pas `docengine/` (les fichiers `CLAUDE.md`, `GUIDE.md`,
> `README.md`, `PASSATION.md` à la racine du dépôt appartiennent à un autre projet,
> sans lien avec EasyPay, et n'ont pas été modifiés pour produire ce dossier).

Statuts utilisés dans tout le document :
**FAIT PROUVÉ** (vérifié en ré-exécutant une commande ou en relisant le code au
moment de la rédaction) · **DÉDUCTION** (déduit du code/des commits, non ré-exécuté)
· **HYPOTHÈSE** (probable mais non vérifiable depuis ce dépôt) · **NON TESTÉ**
· **SIMULATION** · **DÉPENDANCE EXTERNE**.

---

## 1. Résumé exécutif

**Objectif initial** : une appli mobile qui reconnaît n'importe quel QR de paiement
marchand (Wave, Orange Money...) et permet de payer sans dépendre de l'appli
officielle de l'opérateur affiché sur le QR.

**Produit auquel on est arrivé (V2, "EasyPay")** : un portefeuille de paiement
universel. L'utilisateur lie plusieurs portefeuilles mobile money dans EasyPay,
scanne n'importe quel QR marchand, et choisit lui-même avec lequel de ses
portefeuilles il paie — peu importe l'opérateur du QR scanné. EasyPay orchestre un
débit/crédit direct entre les deux comptes (il ne détient jamais l'argent) et
prélève une petite commission. Le statut réglementaire visé (Côte d'Ivoire) est le
**"Service d'Initiation de Paiement"** défini par la BCEAO (janvier 2024).

**État actuel** : 43 écrans construits et reliés entre eux (l'historique parle de
« 47 », voir §7 pour l'écart constaté), contrôle de code sans erreur, 18 tests
automatiques du moteur de reconnaissance QR verts, parcours complet rejoué à la
main dans un navigateur (caméra simulée). **Aucun de ces écrans n'a encore été
ouvert sur un vrai téléphone.**

**Principal écart entre démonstration et fonctionnement réel** : tout ce qui
ressemble à un mouvement d'argent, une vérification d'identité, ou un renvoi vers
l'appli Wave/Orange Money est **simulé en local** (délais artificiels, résultats
toujours positifs sauf cas de test exprès). Aucun réseau réel n'est appelé pour ces
étapes. Le moteur de *reconnaissance* du QR (lire le contenu, deviner l'opérateur)
est, lui, du vrai code testé — mais jamais confronté à un vrai QR Orange Money.

**Prochaine étape concrète** : ouvrir l'appli sur un vrai téléphone via Expo Go (§14,
§15, §16 — Niveau 1), qui est la toute première chose jamais éprouvée en dehors
d'un navigateur.

---

## 2. Besoin initial

Reconstitué à partir du tout premier commit du projet (`3a6d1f8`, message
« Ajoute le MVP du lecteur de QR de paiement universel (Wave / Orange Money) »)
et du README d'origine de `mobile_qr_payer/` (FAIT PROUVÉ, texte relu tel quel).

**Ce que l'utilisateur voulait pouvoir faire, au départ** : à Abidjan, les
commerçants affichent des QR codes de paiement mobile money, mais chaque QR est lié
à un seul opérateur (Wave *ou* Orange Money, pas les deux). Si le client n'a de
l'argent que sur l'autre opérateur que celui affiché, il ne peut pas payer avec ce
QR. L'utilisateur voulait une appli qui :
1. s'ouvre directement sur un lecteur de QR (pas un menu, pas un accueil à
   traverser à chaque lancement) ;
2. reconnaît automatiquement à quel opérateur appartient le QR scanné ;
3. termine le paiement — au départ, l'idée exprimée était d'**ouvrir l'appli
   officielle de l'opérateur reconnu** pour que l'utilisateur finisse avec son
   code secret habituel.

**Contexte** : marché ivoirien, dominé par Wave et Orange Money pour le paiement
QR marchand. L'utilisateur connaît ce terrain de façon fine (usages réels,
comportement des commerçants) mais pas le vocabulaire technique — d'où la consigne
donnée dès le départ (et reprise dans `CLAUDE.md`) de ne jamais lui poser de
question technique, seulement des questions de besoin.

**Contraintes exprimées dès le début** :
- gratuit à utiliser, pas de blocage artificiel ;
- ne doit jamais faire perdre le fil à l'utilisateur (simplicité d'usage) ;
- l'utilisateur ne veut pas être son conseiller réglementaire — il demande de
  construire, et de signaler les blocages "en passant", pas de s'arrêter dessus.

**Ce que ce besoin initial ne disait PAS encore** (important pour ne pas
réinterpréter a posteriori) : rien, à ce stade, sur le fait de lier plusieurs
portefeuilles dans une seule appli, ni sur une commission, ni sur le fait de ne
jamais passer par l'appli officielle de l'opérateur. Cette partie est arrivée plus
tard (§3) — le premier besoin exprimé était plus proche d'un **redirecteur
intelligent** que d'un **portefeuille orchestrateur**.

---

## 3. Évolution du concept

Reconstituée à partir de l'ordre réel des commits et des fichiers produits à
chaque étape (DÉDUCTION, recoupée avec le contenu des messages de commit et des
README successifs, eux-mêmes FAIT PROUVÉ car relus tels quels).

### Étape 1 — Lecteur qui redirige (V0/V1, `mobile_qr_payer/`)
- **Construit** : un lecteur de QR (`src/core/emvco.ts` + `src/core/providers/`)
  qui reconnaît Wave (URL directe `pay.wave.com/...`) et Orange Money/autres (norme
  ouverte EMVCo), puis propose d'ouvrir l'appli officielle correspondante
  (mécanisme `ProviderAction` de type `deeplink`, voir `providers/types.ts`).
- **Décision** : partir d'une brique déjà testée (le moteur de reconnaissance)
  plutôt que d'improviser un parseur de QR.
- **Conséquence** : ce moteur, inchangé, est celui qui équipe encore la V2
  aujourd'hui (§5).

### Étape 2 — Passage à un vrai squelette d'appli (Obytes Starter)
- **Ce qu'on pensait construire** : continuer à étoffer `mobile_qr_payer/` à la
  main, écran par écran.
- **Découverte / demande** : l'utilisateur juge l'appli trop "sommaire" et demande
  de repartir d'un squelette d'appli complet et déjà éprouvé plutôt que de tout
  redessiner (accueil, réglages, navigation...).
- **Décision** : adopter **Obytes Starter** (squelette Expo Router + NativeWind
  + Zustand + MMKV + i18n, open source), après avoir été poussé une première fois
  vers une simple bibliothèque de composants (React Native Paper), jugée
  insuffisante par l'utilisateur.
- **Conséquence** : nouveau dossier `easypay/`, portage du moteur de reconnaissance
  QR dedans (commit `832e9cd`), suppression des écrans de démo du squelette
  (feed, login, style-demo — voir §12).

### Étape 3 — Correction du besoin réel (3 itérations)
C'est l'étape la plus importante de toute la trajectoire — le produit a changé de
nature ici, pas seulement de taille.
- **Ce qu'on pensait construire (au début de cette étape)** : toujours le
  "redirecteur intelligent" de l'étape 1, mais avec plus d'écrans (accueil,
  historique, écran de résultat par QR).
- **Découverte** : en confrontant l'idée à des cas réels (ex. un taxi affiche un
  QR Wave mais le client n'a de l'argent que sur Orange Money), l'utilisateur a
  corrigé la compréhension du projet **trois fois de suite**, chaque fois en
  rejetant une simplification excessive de ma part :
  1. d'abord, clarifier que ce n'est pas "lire puis rediriger vers l'appli
     officielle" mais "l'utilisateur choisit lui-même la source de paiement,
     peu importe le QR scanné" ;
  2. ensuite, clarifier que le mécanisme technique réel existe déjà ailleurs :
     lier plusieurs portefeuilles, puis utiliser l'API/le mécanisme
     d'autorisation propre à chaque opérateur (ex. Wave Checkout : redirection
     vers l'appli Wave, confirmation par l'utilisateur avec son propre code,
     retour automatique) — pas une hypothèse, un mécanisme documenté
     (`docs.wave.com/checkout`) ;
  3. enfin, insister sur le point le plus structurant : EasyPay ne doit
     **jamais détenir l'argent** ("je prends et je paye", pas "je collecte puis
     je reverse"). Un simple passage, avec une petite commission.
- **Décision** : abandonner le modèle "redirecteur" au profit d'un modèle
  "portefeuille orchestrateur à initiation de paiement".
- **Conséquence directe** : le mécanisme `ProviderAction`/`deeplink` de l'étape 1
  reste dans le code (toujours testé) mais **n'est plus utilisé par aucun écran
  de la V2** — voir la contradiction documentée en §5 et §7. La reconnaissance de
  QR sert désormais seulement à identifier/étiqueter l'opérateur affiché sur le
  QR, pas à ouvrir son appli.

### Étape 4 — Spécification à 47 écrans, puis construction (V2)
- **Décision** : découper le produit corrigé en 6 parcours et un nombre précis
  d'écrans (chiffre annoncé : 47), sourcés par recherche réelle (catégories
  BCEAO, exemples d'établissements agréés en Côte d'Ivoire).
- **Construction** : fondations (types, moteur simulé, stockage, navigation)
  écrites directement, puis 5 parcours construits en parallèle par des agents
  logiciels distincts, chacun sur un dossier séparé.
- **Conséquence** : voir §5 à §9 pour l'état réel de cette construction, et §7
  pour l'écart entre le chiffre annoncé (47) et le compte réel des fichiers
  d'écran présents dans le dépôt (43).

### Étape 5 — Durcissement ponctuel après livraison
- Un point technique du "reste à faire" a été traité après la livraison des 47/43
  écrans : le code secret (PIN), stocké en clair jusque-là, est maintenant
  transformé en empreinte (sel + SHA-256) avant stockage (commit `4bda05f`).
  Reste noté explicitement dans ce même commit : le déplacer un jour vers un vrai
  coffre système (`expo-secure-store`) plutôt que le stockage local classique.

---

## 4. Décisions structurantes

**DÉCISION** : le moteur de reconnaissance de QR repose sur la norme ouverte EMVCo
("Merchant-Presented QR Code") pour tout sauf Wave.
**POURQUOI** : Wave utilise une simple URL (`pay.wave.com/m/...`), pas de norme à
interpréter ; Orange Money et la plupart des autres opérateurs ouest-africains
suivent EMVCo, un standard public et documenté (pas un format propriétaire percé).
**ALTERNATIVES ÉCARTÉES** : tenter de deviner le format par opérateur au cas par
cas, sans base commune.
**CONSÉQUENCE** : un seul parseur (`src/core/emvco.ts`) suffit pour tous les futurs
opérateurs EMVCo ; seul Wave a un traitement dédié (`providers/wave.ts`).
**ÉTAT** : toujours valide — c'est la seule brique du projet vérifiée par des
tests automatiques stables depuis l'origine (§8).

---

**DÉCISION** : ne jamais faire transiter l'argent par un compte détenu par
EasyPay ; EasyPay initie un paiement direct entre la source choisie et le
commerçant, et prélève une commission au passage.
**POURQUOI** : c'est la correction la plus importante apportée par l'utilisateur
(étape 3, §3) — un modèle "je collecte puis je reverse" exigerait un agrément
bien plus lourd (établissement de monnaie électronique) et introduirait un risque
de détention de fonds. Le modèle "initiation" correspond à une catégorie BCEAO
déjà existante et déjà utilisée par des acteurs réels en Côte d'Ivoire (Djamo,
CinetPay Africa, PayDunya, entre autres).
**ALTERNATIVES ÉCARTÉES** : EasyPay comme portefeuille à solde propre (rejeté
explicitement par l'utilisateur comme fonction *première* — reste envisageable
comme fonction *secondaire*, plus tard, non construite).
**CONSÉQUENCE** : `src/core/wallet-engine/mockBackend.ts` modélise ce mécanisme
(débit source → crédit commerçant, commission calculée), mais **en simulation
totale** — aucun appel réseau réel, voir §10.
**ÉTAT** : valide sur le plan produit ; **NON RACCORDÉ** sur le plan technique
(aucun contrat, aucune API réelle branchée).

---

**DÉCISION** : lier plusieurs portefeuilles dans EasyPay, plutôt que de se
contenter de reconnaître le QR et rediriger vers l'appli de l'opérateur détecté.
**POURQUOI** : c'est ce qui rend le choix de la source de paiement possible —
sans portefeuilles liés, il n'y a rien à choisir.
**ALTERNATIVES ÉCARTÉES** : le modèle initial "un QR = une appli" (étape 1, §3).
**CONSÉQUENCE** : ajout du parcours "Portefeuilles" (10 écrans, `src/app/(app)/wallets/`)
et du stockage `src/storage/walletsState.ts`.
**ÉTAT** : toujours valide ; la liaison elle-même est **SIMULATION** (§10, §11) —
n'importe quel numéro de téléphone (sauf un exprès) est accepté comme "lié avec
succès", sans jamais contacter l'opérateur réel.

---

**DÉCISION** : garder le mécanisme `ProviderAction`/`deeplink` (ouverture directe
de l'appli officielle) dans le code, sans le brancher aux écrans de paiement V2.
**POURQUOI** : ce n'est pas une décision délibérée documentée comme telle dans
l'historique — c'est un **résidu** de l'étape 1, jamais retiré après le
changement de modèle de l'étape 3 (DÉDUCTION, voir la vérification de code en
§5/§7 : `getAction()` n'est appelé nulle part sous `src/app/`).
**ALTERNATIVES ÉCARTÉES** : n/a (pas une décision consciente).
**CONSÉQUENCE** : ce code existe, est testé (`registry.test.ts`), mais n'a
**aucun effet réel dans le produit actuel** — un lecteur qui ne connaîtrait pas
tout l'historique de conception pourrait croire, à tort, que scanner un QR ouvre
l'appli officielle correspondante. Ce n'est pas ce que fait la V2.
**ÉTAT** : à confirmer — supprimer ce code mort, ou le réactiver un jour comme
option ("ouvrir l'appli officielle" à côté de "payer via EasyPay"), est une
décision de produit non tranchée.

---

**DÉCISION** : stocker toutes les données (portefeuilles liés, identité, code
secret, historique) uniquement en local sur l'appareil (MMKV), rien envoyé à un
serveur.
**POURQUOI** : cohérent avec le fait qu'il n'existe, à ce stade, aucun serveur
réel derrière l'appli — tout le "moteur" est un module JavaScript local
(`mockBackend.ts`) qui simule des réponses.
**ALTERNATIVES ÉCARTÉES** : aucune, à ce stade — un vrai backend n'a jamais été
construit.
**CONSÉQUENCE** : rien de tout ce qui est saisi (numéro, nom, code secret,
historique) ne quitte le téléphone aujourd'hui. C'est vrai autant pour de bonnes
raisons (confidentialité en phase de test) que par absence de serveur réel à
appeler.
**ÉTAT** : valide pour une démo ; devra changer le jour où un vrai fournisseur de
paiement est branché (certaines données devront alors transiter par un vrai
réseau, sous contrat).

---

## 5. Architecture actuelle

### Carte simple du parcours principal

```
Utilisateur
  → onglet "Scanner" (écran d'accueil de l'appli une fois connecté)
  → CameraView (expo-camera) lit un QR
  → src/core/emvco.ts + src/core/providers/registry.ts : reconnaît l'opérateur
    (Wave / Orange Money / générique EMVCo / "non reconnu")
  → src/app/pay/preview.tsx : montre l'opérateur détecté + montant si présent
  → src/app/pay/amount.tsx (si pas de montant sur le QR) : saisie manuelle
  → src/app/pay/choose-source.tsx : liste des portefeuilles liés
    (src/storage/walletsState.ts) → l'utilisateur choisit
  → src/app/pay/recap.tsx : montant + commission + total, calculés par
    src/core/wallet-engine/mockBackend.ts (SIMULATION)
  → src/app/pay/redirect.tsx puis waiting.tsx : attente simulée
    (SIMULATION — aucun vrai renvoi vers une appli tierce)
  → src/app/pay/success.tsx (ou fail.tsx / insufficient-funds.tsx) :
    résultat, transaction enregistrée localement
    (src/storage/transactionsState.ts) — RÉEL pour la partie "écrire en local",
    SIMULATION pour la partie "l'argent a bougé"
  → retour à l'onglet Scanner
```

### Applications présentes dans le dépôt

| Dossier | Rôle | État |
|---|---|---|
| `mobile_qr_payer/` | V0/V1 : lecteur qui reconnaît un QR et propose d'ouvrir l'appli officielle correspondante | Complet pour son périmètre, dépassé par la V2, toujours présent (§12) |
| `easypay/` | V2 : le produit actuel, portefeuille universel à initiation de paiement | En cours, périmètre de construction "terminé", jamais éprouvé en dehors d'un navigateur |

### Composants importants de `easypay/` (FAIT PROUVÉ — relus au moment de la rédaction)

**CHEMIN** : `src/core/emvco.ts`
**RÔLE** : parseur du format EMVCo "Merchant-Presented QR" (découpage Tag/Longueur/Valeur), extraction montant/commerçant/pays/devise.
**ÉTAT** : testé (`src/core/__tests__/emvco.test.ts`), identique au fichier de `mobile_qr_payer/`.
**DÉPENDANCES** : aucune (fonctions pures).

**CHEMIN** : `src/core/providers/{wave,orangeMoney,genericEmvco,registry,types,knownGuids}.ts`
**RÔLE** : reconnaît à quel opérateur appartient un QR scanné (`detect()`), et modélise (mais n'utilise plus, voir §4) une action de type "ouvrir l'appli officielle" (`getAction()`).
**ÉTAT** : `detect()`/`registry.resolveProvider()` utilisé activement par `pay/preview.tsx` et `pay/success.tsx`. `getAction()` **non appelé** par aucun écran (code mort dans le parcours actuel, mais toujours testé isolément).
**DÉPENDANCES** : `emvco.ts`.

**CHEMIN** : `src/core/wallet-engine/types.ts`, `operators.ts`, `mockBackend.ts`, `paymentDraftStore.ts`
**RÔLE** : modèle de données (opérateurs liables, portefeuille, transaction, KYC, auth) + moteur de paiement **simulé** + état temporaire (zustand, en mémoire) d'un paiement en cours de préparation.
**ÉTAT** : `mockBackend.ts` est intégralement SIMULATION, documentée comme telle dans un commentaire en tête de fichier.
**DÉPENDANCES** : aucune lib externe pour la logique (zustand seulement pour `paymentDraftStore`).

**CHEMIN** : `src/storage/{walletsState,authState,kycState,transactionsState}.ts`
**RÔLE** : persistance locale (MMKV) des portefeuilles liés, de l'état d'authentification (téléphone, empreinte du code secret), du profil KYC, et des 50 dernières transactions.
**ÉTAT** : RÉEL pour la mécanique de stockage (les données sont vraiment écrites/relues sur l'appareil, vérifié §8) ; le *contenu* de ce qui y est stocké (ex. "identité vérifiée") reste le résultat d'une SIMULATION en amont.
**DÉPENDANCES** : `src/lib/storage.tsx` (wrapper MMKV fourni par le squelette Obytes), `expo-crypto` (empreinte du code secret).

**CHEMIN** : `src/features/scanner/scanner-screen.tsx`
**RÔLE** : écran caméra réel (`expo-camera`, composant `CameraView`, détection de codes-barres de type `qr`), demande de permission caméra incluse.
**ÉTAT** : code réel, utilisant une vraie bibliothèque caméra — mais **jamais exécuté sur un vrai appareil** (§9).
**DÉPENDANCES** : `expo-camera` (`~17.0.10`).

**CHEMIN** : `src/app/(auth)/`, `src/app/(app)/wallets|history|account/`, `src/app/pay/`
**RÔLE** : les 43 écrans eux-mêmes (détail §6), plus les fichiers de navigation (`_layout.tsx`) qui les relient.
**ÉTAT** : contrôle de code sans erreur (§8), navigation vérifiée en navigateur.
**DÉPENDANCES** : `expo-router` (`~6.0.22`, routage par fichiers).

### Ce qui n'existe PAS dans l'architecture actuelle
- Aucun serveur, aucune base de données distante, aucune API réseau réelle vers
  un opérateur ou un agrégateur.
- Aucun compte Expo/EAS réel n'est configuré (`app.config.ts` : `EXPO_ACCOUNT_OWNER`
  et `EAS_PROJECT_ID` sont vides) — donc pas de lien de prévisualisation partageable
  ni de build installable produit à ce jour (FAIT PROUVÉ, fichier relu).

---

## 6. Parcours utilisateur actuellement implémentés

**PARCOURS** : Démarrage & vérification d'identité
**POINT DE DÉPART** : premier lancement de l'appli (`(auth)/welcome.tsx`)
**ÉTAPES** : bienvenue → téléphone → code SMS → création code secret → confirmation
code secret → consentement → informations personnelles (nom, date de naissance,
type de pièce) → statut de vérification → écran d'accueil (Scanner)
**RÉSULTAT ATTENDU** : un compte EasyPay "vérifié", prêt à lier des portefeuilles
**CE QUI EST RÉEL** : la navigation, l'écriture en local du numéro, du code secret
(sous forme d'empreinte, depuis §3 étape 5), du consentement, des informations
saisies.
**CE QUI EST SIMULÉ** : l'envoi du code SMS (aucun SMS n'est réellement envoyé —
n'importe quelle suite de 6 chiffres est acceptée) ; la vérification d'identité
(aucune pièce n'est réellement photographiée ni contrôlée — un simple texte saisi,
« vérifié » automatiquement après 3 secondes d'attente artificielle).
**CE QUI N'A PAS ÉTÉ TESTÉ** : réception d'un vrai SMS, upload/scan réel d'une
pièce d'identité (n'existe pas dans le code — l'écran `documents.tsx` du compte
n'affiche qu'un statut texte, il ne permet ni de photographier ni de consulter un
document), comportement sur un vrai clavier de téléphone.

---

**PARCOURS** : Lier un portefeuille
**POINT DE DÉPART** : onglet "Portefeuilles" → "Ajouter un portefeuille"
**ÉTAPES** : choix de l'opérateur (Wave, Orange Money, Push by PalmPay, Djamo, MTN
Money, Moov Money) → numéro de téléphone → écran d'explication → attente → succès
ou échec
**RÉSULTAT ATTENDU** : le portefeuille apparaît dans la liste, utilisable comme
source de paiement
**CE QUI EST RÉEL** : écriture en local du portefeuille lié (`walletsState.ts`),
gestion du portefeuille "par défaut".
**CE QUI EST SIMULÉ** : la liaison elle-même (`mockBackend.linkWallet`) —
aucun contact réel avec Wave/Orange Money/etc. ; réussite automatique sauf un
numéro de test précis (`0000000000`) qui déclenche volontairement l'écran
d'échec.
**CE QUI N'A PAS ÉTÉ TESTÉ** : toute vraie liaison avec un opérateur réel
(nécessiterait une vraie API/un vrai contrat, §10).

---

**PARCOURS** : Scanner un QR marchand et payer (le parcours central du produit)
**POINT DE DÉPART** : onglet "Scanner"
**ÉTAPES** : scan → reconnaissance de l'opérateur affiché sur le QR → montant (lu
sur le QR ou saisi) → choix de la source de paiement parmi les portefeuilles liés
→ récapitulatif (montant + commission + total) → confirmation → écran "redirection"
→ écran "attente" → résultat (succès / échec / fonds insuffisants)
**RÉSULTAT ATTENDU** : le commerçant est payé depuis la source choisie, EasyPay
prélève sa commission, une trace apparaît dans l'historique.
**CE QUI EST RÉEL** : la lecture caméra elle-même (vraie bibliothèque caméra), le
parsing EMVCo/Wave du QR (vrai code testé), le calcul de la commission (vraie
formule, appliquée à un montant réel saisi ou lu), l'écriture de la transaction
dans l'historique local après succès.
**CE QUI EST SIMULÉ** : absolument tout ce qui suit le clic "Confirmer le
paiement" — l'écran "redirection" (texte "On t'emmène chez Wave pour valider...")
**n'ouvre aucune vraie appli tierce**, c'est une minuterie fixe de 1,2 seconde ;
le solde vérifié pour décider "fonds insuffisants" est une **constante unique de
50 000 FCFA**, la même quel que soit l'opérateur choisi (pas un vrai solde par
portefeuille) ; aucun franc ne change réellement de main.
**CE QUI N'A PAS ÉTÉ TESTÉ** : un vrai QR marchand (Wave ou Orange Money), la
caméra sur un vrai téléphone, tout comportement réseau réel.

---

**PARCOURS** : Historique
**POINT DE DÉPART** : onglet "Historique"
**ÉTAPES** : liste des paiements passés → détail d'un paiement → filtre → signaler
un problème
**RÉSULTAT ATTENDU** : retrouver ses paiements passés (jusqu'à 50), même simulés.
**CE QUI EST RÉEL** : lecture/écriture locale réelle des transactions.
**CE QUI EST SIMULÉ** : le contenu des transactions lui-même (puisque les
paiements sous-jacents sont simulés).
**CE QUI N'A PAS ÉTÉ TESTÉ** : comportement avec un historique long (50+
entrées), l'écran "signaler un problème" (`report.tsx`) ne semble relié à aucune
destination réelle (pas de canal de support connecté — DÉDUCTION à vérifier).

---

**PARCOURS** : Compte & réglages
**POINT DE DÉPART** : onglet "Compte"
**ÉTAPES** : profil, modifier ses informations, documents (statut KYC), sécurité,
notifications, aide, support, à propos — plus les réglages hérités du squelette
Obytes (langue, thème).
**RÉSULTAT ATTENDU** : gérer son compte et ses préférences.
**CE QUI EST RÉEL** : navigation, lecture du profil/KYC stocké en local, le
changement de thème clair/sombre (hérité du squelette, fonctionne indépendamment
d'EasyPay).
**CE QUI EST SIMULÉ / INCOHÉRENT** : le sélecteur de langue, hérité tel quel du
squelette Obytes, ne propose que **anglais et arabe** — aucun fichier de
traduction français n'existe (`src/translations/` ne contient que `en.json` et
`ar.json`). Or tous les écrans propres à EasyPay sont écrits en français **en
dur**, sans passer par ce système de traduction. Résultat concret, jamais
vérifié : si un utilisateur touche ce sélecteur de langue, on ignore ce qui se
passe réellement à l'écran (probablement rien de visible, puisque nos écrans
n'utilisent pas ce mécanisme — mais ce n'est qu'une DÉDUCTION, pas un test réel).
**CE QUI N'A PAS ÉTÉ TESTÉ** : ce comportement du sélecteur de langue, précisément.

---

## 7. Matrice de vérité

| Fonction | Catégorie | Preuve | Fichier / test |
|---|---|---|---|
| Parser EMVCo (lire un QR de paiement standard) | **A — Prouvé fonctionnel** | Tests automatiques verts, ré-exécutés à la rédaction | `src/core/emvco.ts`, `src/core/__tests__/emvco.test.ts` |
| Reconnaissance Wave (URL directe) | **A — Prouvé fonctionnel** (pour la reconnaissance ; pas pour le paiement) | Tests automatiques + logique triviale (URL fixe) | `src/core/providers/wave.ts` |
| Reconnaissance Orange Money (heuristique EMVCo) | **B — Testé mais partiel** | Tests avec QR fabriqués à la main, jamais un vrai QR Orange Money | `src/core/providers/orangeMoney.ts` |
| Navigation entre les 43 écrans | **A — Prouvé fonctionnel** (dans un navigateur) | Contrôle de code sans erreur + parcours rejoué en Playwright | `src/app/**` |
| Écriture/lecture locale (portefeuilles, historique, KYC, auth) | **A — Prouvé fonctionnel** | Relecture du stockage après action, en direct, à la rédaction (ex. empreinte du code secret) | `src/storage/*.ts` |
| Caméra réelle (permission + lecture QR) | **C — Construit mais jamais testé en conditions réelles** | Code présent, utilise une vraie librairie ; seule une caméra *simulée* de navigateur a été utilisée | `src/features/scanner/scanner-screen.tsx` |
| Liaison d'un portefeuille à un opérateur | **D — Conceptuel / simulé** | `linkWallet()` ne contacte rien de réel | `src/core/wallet-engine/mockBackend.ts` |
| Vérification d'identité (KYC) | **D — Conceptuel / simulé** | Auto-validation après un délai fixe, aucun contrôle réel | `src/storage/kycState.ts` |
| Redirection vers l'appli de l'opérateur pour valider | **D — Conceptuel / simulé** | Minuterie fixe, aucun appel `Linking`/deep link réel | `src/app/pay/redirect.tsx` |
| Débit réel d'un compte / crédit réel d'un commerçant | **D — Conceptuel / simulé** | Aucun réseau, constante de solde fixe | `src/core/wallet-engine/mockBackend.ts` |
| Calcul de la commission | **A — Prouvé fonctionnel** (le calcul lui-même ; pas son prélèvement réel) | Fonction pure, appliquée et affichée correctement dans le parcours rejoué | `computeCommission()` |
| Mécanisme "ouvrir l'appli officielle" (`getAction`) | **C — Construit mais jamais raccordé dans le produit** | Testé isolément, mais appelé par aucun écran | `src/core/providers/registry.ts` (+ tests) |
| Code secret non stocké en clair | **A — Prouvé fonctionnel** | Stockage relu en direct après création du code : seules empreinte + sel présents | `src/storage/authState.ts` |

---

## 8. Tests et vérifications déjà effectués

**TEST** : suite automatique du moteur de reconnaissance QR (V2)
**COMMANDE** : `cd easypay && pnpm test`
**RÉSULTAT** : 6 suites de tests, 2 réussies (18 tests, tous verts), 4 échouées.
**PREUVE** : ré-exécuté au moment de la rédaction de ce dossier (pas seulement
rapporté de mémoire).
**LIMITES** : les 4 suites en échec ne concernent pas notre code — ce sont des
tests hérités du squelette Obytes (`button.test.tsx`, `checkbox.test.tsx`,
`input.test.tsx`, `select.test.tsx`) qui échouent tous pour la même raison
technique (`@react-navigation/native` livré dans un format que l'outil de test ne
sait pas encore transformer). Comportement identique avant et après tout le
travail EasyPay — pas une régression introduite.

**TEST** : contrôle de code (types) V2
**COMMANDE** : `cd easypay && pnpm run type-check`
**RÉSULTAT** : aucune erreur.
**PREUVE** : ré-exécuté au moment de la rédaction.
**LIMITES** : un contrôle de types ne prouve pas qu'un écran s'affiche
correctement ni qu'un comportement est correct — seulement que le code est
cohérent avec lui-même.

**TEST** : suite automatique du moteur de reconnaissance QR (V0/V1, `mobile_qr_payer/`)
**COMMANDE** : `cd mobile_qr_payer && npm test`
**RÉSULTAT** : 3 suites, 22 tests, tous verts.
**PREUVE** : ré-exécuté au moment de la rédaction — confirme exactement ce
qu'annonçait le README d'origine de ce dossier.
**LIMITES** : couvre uniquement `mobile_qr_payer/`, pas `easypay/` (les deux
dossiers ont des jeux de tests distincts, bien que le cœur du code soit
identique).

**TEST** : parcours complet rejoué en navigateur (Playwright, caméra simulée)
**PROCÉDURE** : script automatisé ouvrant l'appli servie en web
(`npx expo start --web`), remplissant les champs et cliquant les boutons dans
l'ordre du parcours décrit en §6, avec capture d'écran à chaque étape.
**RÉSULTAT** : le parcours complet (inscription → identité → ajout d'un
portefeuille Wave → scan simulé d'un QR Wave → choix de la source → récapitulatif
avec commission affichée → confirmation → historique) s'exécute sans erreur
bloquante.
**PREUVE** : 25 captures d'écran produites pendant la session ; 10 envoyées
directement à l'utilisateur par message. **Aucune de ces captures n'a été
committée dans le dépôt Git** — elles n'existent que dans le dossier temporaire
de la session cloud (qui disparaît à la fin de la session) et dans la messagerie
où elles ont été envoyées. Ce n'est donc pas une preuve durable *dans le dépôt*.
**LIMITES** : navigateur de bureau, pas un téléphone ; caméra factice
(`--use-fake-device-for-media-stream`), pas une vraie caméra ; QR de test saisis
manuellement (`manual-entry.tsx`) ou générés pour le test, pas un vrai QR
marchand scanné à la caméra.

**TEST** : vérification que le code secret n'est plus stocké en clair
**PROCÉDURE** : parcours d'inscription rejoué jusqu'à la création du code secret,
puis lecture directe du contenu du stockage local du navigateur.
**RÉSULTAT** : seules deux clés liées au code secret existent
(`auth_pin_salt_v1`, `auth_pin_hash_v1`), toutes deux des valeurs opaques (sel
aléatoire et empreinte SHA-256) — aucune trace du code en clair.
**PREUVE** : sortie de commande capturée au moment de la rédaction de ce dossier
(§ précédente conversation).
**LIMITES** : vérifié en navigateur (MMKV web = localStorage), pas sur un vrai
appareil (le mécanisme MMKV natif est différent en stockage bas niveau, bien que
l'API utilisée dans le code soit la même).

**TESTS NON EFFECTUÉS explicitement listés ici pour clarté** (détaillés en §9) :
test Orange Money avec un vrai QR, test Wave avec un vrai QR, test de
redirection réelle vers une appli tierce, test réseau réel, tout test sur
téléphone physique.

---

## 9. Ce qui n'a JAMAIS été testé

Cette section liste, sans rien cacher, tout ce qui pourrait donner l'impression
de fonctionner alors que ce n'est pas prouvé.

- **Vrai téléphone** : NON TESTÉ. L'appli n'a jamais été ouverte sur un appareil
  Android ou iPhone physique, à aucun moment de son histoire (V0 comme V2).
- **Expo Go** : NON TESTÉ. Jamais scanné le QR Expo depuis un vrai téléphone.
- **Caméra réelle** : NON TESTÉ. Seule une caméra simulée de navigateur a servi
  aux vérifications.
- **Ordinateur + téléphone sur le même Wi-Fi** : NON TESTÉ (n'a jamais été
  nécessaire jusqu'ici, tout s'est fait dans un atelier cloud sans accès à un
  vrai réseau Wi-Fi local).
- **Vrai QR marchand (n'importe quel opérateur)** : NON TESTÉ. Tous les QR
  utilisés en test sont soit fabriqués à la main (chaînes EMVCo construites pour
  les tests automatiques), soit une URL Wave plausible mais non issue d'un vrai
  commerçant.
- **Vrai QR Orange Money** : NON TESTÉ. La reconnaissance Orange Money repose sur
  une heuristique du standard EMVCo, jamais confrontée à un exemplaire réel.
- **Vrai QR Wave** : NON TESTÉ à la caméra (seulement une URL Wave plausible
  saisie manuellement dans le formulaire de test `manual-entry.tsx`).
- **Ouverture réelle de l'appli d'un opérateur** : NON TESTÉ, et actuellement
  **impossible tel que le code est câblé** — voir §4/§5, le mécanisme existe
  (`getAction`) mais n'est appelé par aucun écran du parcours de paiement V2.
- **Compatibilité Android / iPhone** : NON TESTÉ sur aucun des deux.
- **Retour après paiement** : NON TESTÉ dans un scénario réel — seul le retour
  simulé (minuterie) a été observé.
- **Paiement avec argent réel** : NON TESTÉ, et impossible actuellement (§10).
- **API opérateurs (Wave, Orange Money, ou un agrégateur)** : aucune n'a jamais
  été appelée par ce code, même en test — DÉPENDANCE EXTERNE non levée.
- **Marchand réel** : aucun test effectué avec un commerçant réel.
- **Connexion réseau réelle pour les étapes de paiement** : NON TESTÉ — tout se
  passe en mémoire locale.
- **Comportement du sélecteur de langue** (anglais/arabe, hérité du squelette)
  sur les écrans EasyPay écrits en français en dur : NON TESTÉ (voir §6, parcours
  Compte).
- **Comportement avec un historique de 50+ transactions** : NON TESTÉ.
- **Build installable réel (EAS Build) ou lien de prévisualisation partageable
  (EAS Update)** : NON TESTÉ, et actuellement impossible — aucun compte Expo réel
  n'est configuré (`EXPO_ACCOUNT_OWNER`/`EAS_PROJECT_ID` vides dans
  `app.config.ts`).

---

## 10. Argent réel : frontière exacte

**Est-ce qu'un seul franc peut actuellement être déplacé par EasyPay ? NON.**

**Pourquoi** : chaque fonction qui, dans un vrai produit, contacterait un
opérateur ou une banque, est aujourd'hui remplacée par une fonction locale qui
attend un court délai artificiel puis renvoie un résultat déterministe (succès
sauf cas de test exprès). Ce n'est pas une API réelle rendue indisponible ou mal
configurée — **il n'existe tout simplement aucun code réseau réel à ces
endroits**. Le fichier `src/core/wallet-engine/mockBackend.ts` le dit lui-même en
commentaire, en toutes lettres, depuis sa création.

**Ce qui est actuellement simulé** :
- l'envoi et la vérification du code SMS (`sendOtp`, `verifyOtp`) ;
- la liaison d'un portefeuille à un opérateur (`linkWallet`) ;
- la vérification d'identité (délai fixe puis "vérifié") ;
- l'initiation du paiement lui-même (`initiatePayment`) — y compris le contrôle
  de solde, qui compare le montant à une **constante fixe de 50 000 FCFA**,
  identique quel que soit l'opérateur choisi (pas un vrai solde par opérateur) ;
- la "redirection" vers l'appli de l'opérateur pour validation (une minuterie,
  pas un vrai renvoi d'application).

**Ce qui nécessiterait un contrat, une API, un compte marchand ou un
intermédiaire** :
- un agrément ou un statut réglementaire ("Service d'Initiation de Paiement"
  BCEAO, ou passer par un établissement déjà agréé comme intermédiaire) ;
- un accès aux API de chaque opérateur (Wave, Orange Money, etc.) ou à un
  agrégateur qui les détient déjà (Djamo, CinetPay Africa, PayDunya, Julaya,
  Touchpoint, Feexpay, Syca, Firstcom, Paymetrust étaient, à la connaissance
  rassemblée pendant ce projet, les établissements de paiement agréés en Côte
  d'Ivoire au moment de la conception — DÉDUCTION/HYPOTHÈSE, à revérifier auprès
  de la BCEAO au moment de la reprise, cette liste peut avoir changé) ;
- des identifiants techniques réels (clés d'API, comptes marchands) propres à
  EasyPay, qui n'existent pas dans ce dépôt et ne peuvent pas y exister avant la
  signature de vrais contrats.

**Architecture envisagée pour rendre cela réel** (HYPOTHÈSE / plan, jamais
construit) : remplacer, un par un et **sans changer leur signature**, les
fonctions de `mockBackend.ts` par de vrais appels réseau vers le fournisseur
retenu — c'est explicitement la raison pour laquelle ce fichier existe comme
point de bascule unique, pour que les écrans n'aient pas à changer.

**Distinction demandée** :
- **TECHNIQUEMENT CONSTRUIT** : le parcours complet, les écrans, le calcul de
  commission, le stockage local, la reconnaissance de QR.
- **COMMERCIALEMENT / OPÉRATIONNELLEMENT RACCORDÉ** : rien. Zéro contrat, zéro
  API réelle, zéro compte marchand, à la date de ce dossier.

---

## 11. Orange Money, Wave et autres sources

### Wave
**Ce que l'appli sait faire aujourd'hui** : reconnaître qu'un texte scanné est un
lien Wave (`pay.wave.com/...`) et l'étiqueter comme tel à l'écran.
**Mécanisme** : URL directe, pas un format à décoder — VÉRIFIÉ par recherche au
moment de la conception (pas une hypothèse).
**Standard QR concerné** : aucun standard partagé, propre à Wave.
**API éventuelle** : Wave dispose d'une vraie API documentée ("Wave Checkout",
`docs.wave.com/checkout`) permettant de créer une session de paiement, rediriger
l'utilisateur vers l'appli Wave, et recevoir une confirmation automatique
(webhook) — **jamais appelée par ce code**, seulement identifiée comme mécanisme
plausible pendant la phase de conception.
**Compte marchand requis** : oui, pour utiliser cette API en vrai — pas configuré
ici.
**Test effectué** : reconnaissance d'une URL Wave plausible, saisie à la main.
**Test manquant** : un vrai QR Wave scanné à la caméra ; tout appel réel à l'API
Wave Checkout.
**Incertitudes restantes** : aucune sur le format du QR (confirmé) ; tout sur le
mécanisme d'intégration réel avec l'API Checkout (jamais mis en œuvre, seulement
documenté).

### Orange Money
**Ce que l'appli sait faire aujourd'hui** : tenter de reconnaître un QR comme
Orange Money via une heuristique fondée sur le standard EMVCo (identifiants
GUID trouvés dans les blocs marchands du QR).
**Mécanisme** : SUPPOSÉ conforme au standard EMVCo, jamais confirmé contre un
vrai exemplaire Orange Money.
**Standard QR concerné** : EMVCo "Merchant-Presented QR Code" (standard ouvert).
**API éventuelle** : non identifiée/non intégrée dans ce projet.
**Compte marchand requis** : oui, pour tout mouvement réel — pas configuré ici.
**Test effectué** : reconnaissance de QR EMVCo fabriqués à la main pour les tests
automatiques.
**Test manquant** : confrontation à un vrai QR Orange Money (mentionné comme
manquant depuis le tout premier README du projet, toujours vrai aujourd'hui).
**Incertitudes restantes** : réelles — la reconnaissance pourrait échouer ou mal
extraire des champs face à un vrai QR, tant qu'un exemplaire réel n'a pas été
testé.

### Push by PalmPay, Djamo, MTN Money, Moov Money
**Ce que l'appli sait faire aujourd'hui** : les proposer comme opérateurs
"liables" dans le parcours Portefeuilles (`src/core/wallet-engine/operators.ts`)
— nom, couleur, identifiant technique. **Aucune reconnaissance de QR spécifique
à ces opérateurs n'existe dans le moteur** (`src/core/providers/` ne contient de
logique dédiée que pour Wave et Orange Money ; les autres tomberaient dans le
détecteur générique EMVCo s'ils suivent ce standard, ou ne seraient pas reconnus
du tout).
**Mécanisme** : HYPOTHÈSE non vérifiée pour chacun (aucune recherche dédiée par
opérateur documentée dans ce dépôt au-delà de Wave/Orange Money).
**Test effectué** : aucun.
**Incertitudes restantes** : entières, opérateur par opérateur.

---

## 12. Anciennes versions et dette résiduelle

| Élément | Statut |
|---|---|
| `mobile_qr_payer/` (V0/V1 complète) | **À DÉCIDER** — dépassée par la V2 sur le plan produit, mais son moteur de reconnaissance QR (22/22 tests, ré-exécutés à la rédaction) reste une référence saine. Rien n'oblige à la supprimer immédiatement. |
| Mécanisme `getAction`/`ProviderAction` (deeplink) dans `easypay/src/core/providers/` | **À DÉCIDER** — code mort dans le parcours V2 actuel (§4, §7). À retirer, ou à réactiver consciemment comme option produit. |
| `easypay/src/features/settings/settings-screen.tsx` | **OBSOLÈTE** (probable) — n'est plus importé par aucune route depuis la suppression de l'ancien écran "Réglages" à 5 onglets ; seuls ses sous-composants (`SettingsContainer`, `LanguageItem`, `ThemeItem`) sont réutilisés ailleurs. |
| `easypay/src/translations/{en,ar}.json` + tout le système i18n hérité | **À DÉCIDER** — aucun fichier français n'existe alors que tous les écrans EasyPay sont en français en dur ; soit ajouter un vrai `fr.json` et brancher les écrans dessus, soit retirer le sélecteur de langue pour ne pas exposer un choix qui ne fait rien d'utile aujourd'hui. |
| `easypay/src/app/[...messing].tsx` | **À DÉCIDER** — fichier hérité du squelette Obytes (route "catch-all", nom probablement d'origine, non renommé/adapté), jamais vérifié ni personnalisé pour EasyPay. |
| Script `e2e-test` dans `easypay/package.json` (Maestro, `APP_ID=com.obytes.development`) | **OBSOLÈTE** — référence encore l'identifiant du squelette Obytes d'origine, jamais adapté ni exécuté pour EasyPay. |
| `easypay/src/features/{feed,auth,style-demo}/*`, `src/app/login.tsx`, etc. | **Déjà supprimés** (commit `832e9cd`) — mentionnés ici seulement pour mémoire, aucune action requise. |

**Rien de tout cela n'a été supprimé pendant la rédaction de ce dossier**, conformément à la consigne de la mission.

---

## 13. État Git exact

**Dépôt** : `yayakoub-sys/vd-42_exercices`
**Branche actuelle** : `claude/universal-qr-code-reader-4cdw9s`
**HEAD** : `4bda05fcee2efb45474c78ae0511669e6f153b21`
**Arbre de travail** : propre au moment de la rédaction (`git status --short` :
aucune sortie — aucun fichier modifié ou non suivi), avant la création de ce
dossier lui-même.

**Derniers commits significatifs pour EasyPay, du plus récent au plus ancien** :
| Commit | Date | Rôle |
|---|---|---|
| `4bda05f` | 2026-08-01 12:08 | Sécurise le code secret (sel + empreinte SHA-256) |
| `0f0a865` | 2026-08-01 02:11 | Intègre et vérifie la V2 (47 écrans annoncés — voir écart §7), documentation à jour |
| `2106d7b` | 2026-08-01 01:56 | Checkpoint : parcours Compte et Scanner & payer construits |
| `96d7fe0` | 2026-08-01 01:53 | Checkpoint : fondations V2 + parcours en cours |
| `99ce553` | 2026-07-31 23:54 | Fixe les numéros de version des deux apps |
| `7884c50` | 2026-07-31 23:53 | Ajoute le guide de passation `PASSATION-EASYPAY.md` |
| `832e9cd` | 2026-07-31 09:40 | Porte le moteur EasyPay dans le squelette Obytes, supprime les écrans de démo du squelette |
| `8a36e4c` | 2026-07-30 22:55 | Démarre `easypay/` sur le squelette Obytes Starter |
| `bc1d084` | 2026-07-30 20:16 | Ajoute le support web à `mobile_qr_payer/` |
| `a4b70a5` | 2026-07-30 19:22 | Renomme l'appli en EasyPay |
| `714cd8a` | 2026-07-30 19:21 | Adopte React Native Paper (étape intermédiaire, dépassée ensuite) |
| `ad0c151` | 2026-07-30 19:08 | Ajoute accueil, historique, identité visuelle (V0/V1) |
| `6edfde3` | 2026-07-30 18:18 | Ajoute expo-updates (V0/V1) |
| `3a6d1f8` | 2026-07-30 16:59 | **Premier commit EasyPay** — MVP du lecteur de QR |

**Branches présentes dans le dépôt** :
- `claude/universal-qr-code-reader-4cdw9s` (courante — tout le travail EasyPay)
- `claude/web-app-document-processing-na5del` (projet `docengine`, sans lien avec EasyPay)
- Les mêmes deux branches existent côté `origin` (dépôt distant), synchronisées.

Les commits antérieurs à `3a6d1f8` (`b495696`, `168e7a9`, `bde75cb`, `1b126b1`)
appartiennent au projet `docengine`, présent dans le même dépôt mais sans rapport
avec EasyPay.

---

## 14. Comment démarrer EXACTEMENT l'application actuelle

Sur cet ordinateur, dans un terminal neuf :

1. **Aller dans le bon dossier** :
   ```sh
   cd easypay
   ```
2. **Installer les dépendances** (une seule fois, ou après toute mise à jour du
   projet) :
   ```sh
   pnpm install
   ```
   *(Ce projet utilise `pnpm`, pas `npm` — c'est une exigence du squelette
   Obytes Starter sur lequel il est construit.)*
3. **Lancer l'appli** :
   ```sh
   pnpm start
   ```
4. **Ce qu'on doit voir** : le terminal affiche un gros QR code ASCII, et une
   adresse du type `exp://192.168.x.x:8081`.
5. **Adresse/QR Expo** : ce QR-là (celui du terminal) n'est pas un QR de paiement
   — c'est le lien qui permet à un téléphone d'ouvrir l'appli EasyPay via
   Expo Go (voir §15/§16).
6. **Pour arrêter proprement** : `Ctrl + C` dans le terminal où `pnpm start`
   tourne.

**Vérifier que tout va bien avant de tester sur téléphone** (facultatif, mais
recommandé) :
```sh
pnpm run type-check   # doit afficher aucune erreur
pnpm test             # doit afficher "18 passed" (4 suites en échec attendues, voir §8)
```

**Aucune ancienne commande** (`npm start` depuis `mobile_qr_payer/`, ou tout ce
qui référence `com.obytes.*`) ne s'applique à la version actuelle du produit.

---

## 15. Prérequis pour le test sur téléphone

```
[ ] Ordinateur allumé, avec ce dépôt Git disponible dessus
[ ] pnpm install déjà exécuté au moins une fois dans easypay/
[ ] Téléphone disponible (Android ou iPhone)
[ ] Ordinateur et téléphone connectés au MÊME réseau Wi-Fi
    (obligatoire : Expo Go doit pouvoir joindre l'ordinateur sur le réseau local)
[ ] Application Expo Go installée sur le téléphone (gratuite, Play Store / App Store)
[ ] Projet lancé sur l'ordinateur (pnpm start, dans easypay/)
[ ] QR Expo visible dans le terminal
[ ] Rien d'autre n'est requis pour ce premier niveau de test —
    pas de compte à créer, pas de carte bancaire, pas de vrai numéro Wave/Orange Money
```

---

## 16. PLAN DE VÉRIFICATION RÉELLE — PAS À PAS

### Niveau 1 — L'application s'ouvre sur mon téléphone
**BUT** : confirmer que l'appli existe vraiment en dehors d'un navigateur
d'ordinateur.
**CE QUE JE DOIS FAIRE** : lancer `pnpm start` sur l'ordinateur, ouvrir Expo Go
sur le téléphone, scanner le QR affiché dans le terminal (bouton "Scan QR code"
dans Expo Go, ou l'appareil photo natif sur iPhone).
**CE QUE JE DOIS VOIR** : après un temps de chargement (peut prendre une minute
la première fois), l'écran de bienvenue EasyPay s'affiche sur le téléphone.
**SI ÇA MARCHE** : passer au Niveau 2.
**SI ÇA NE MARCHE PAS** : le cas le plus fréquent est que le téléphone et
l'ordinateur ne sont pas sur le même Wi-Fi — vérifier ça en premier.
**PREUVE À RECUEILLIR** : une photo de l'écran du téléphone.

### Niveau 2 — Interface correcte
**BUT** : vérifier que l'écran ressemble à ce qui a été vérifié en navigateur.
**CE QUE JE DOIS FAIRE** : juste regarder l'écran de bienvenue, puis appuyer sur
"Commencer".
**CE QUE JE DOIS VOIR** : le texte en français, les couleurs violet/indigo/or
d'EasyPay (pas les couleurs par défaut d'un autre projet).
**SI ÇA MARCHE** : Niveau 3.
**SI ÇA NE MARCHE PAS** : noter précisément ce qui diffère (texte manquant,
couleurs, mise en page cassée) et une photo.
**PREUVE À RECUEILLIR** : photo.

### Niveau 3 — Autorisation caméra
**BUT** : vérifier que le téléphone demande bien la permission caméra, avec le
bon message en français.
**CE QUE JE DOIS FAIRE** : avancer dans l'inscription (téléphone, code — n'importe
quelle suite de 6 chiffres fonctionne, c'est simulé exprès — code secret,
consentement, informations personnelles) jusqu'à arriver sur l'écran Scanner.
**CE QUE JE DOIS VOIR** : une demande d'autorisation système pour la caméra,
avec le texte "La caméra sert uniquement à lire les QR codes de paiement, aucune
photo n'est enregistrée."
**SI ÇA MARCHE** : autoriser, puis Niveau 4.
**SI ÇA NE MARCHE PAS** : si aucune demande n'apparaît ou si l'écran reste noir,
c'est le tout premier point de blocage réel jamais rencontré par ce projet sur
un vrai appareil — à documenter précisément (modèle de téléphone, message
d'erreur exact).
**PREUVE À RECUEILLIR** : photo de la demande de permission.

### Niveau 4 — Lecture d'un QR de test
**BUT** : confirmer que la caméra détecte physiquement un QR code.
**CE QUE JE DOIS FAIRE** : afficher n'importe quel QR code simple (par exemple un
généré sur un ordinateur avec le texte `https://pay.wave.com/m/M_ci_TEST/c/ci`)
sur un autre écran, et viser avec la caméra du téléphone.
**CE QUE JE DOIS VOIR** : l'appli réagit dès que le QR est net dans le cadre
(passage automatique à l'écran suivant).
**SI ÇA MARCHE** : Niveau 5.
**SI ÇA NE MARCHE PAS** : vérifier la netteté/distance du QR ; sinon, c'est un
vrai problème technique à remonter.
**PREUVE À RECUEILLIR** : rien de spécial, la suite du parcours en est la preuve.

### Niveau 5 — Interprétation du QR
**BUT** : vérifier que l'appli affiche bien l'opérateur reconnu et un éventuel
montant.
**CE QUE JE DOIS FAIRE** : rien de plus qu'au niveau 4 — regarder l'écran qui
suit le scan.
**CE QUE JE DOIS VOIR** : une pastille de couleur avec le nom de l'opérateur
détecté (ex. "Wave"), et un montant si le QR de test en contenait un.
**SI ÇA MARCHE** : Niveau 6.
**SI ÇA NE MARCHE PAS** : noter le texte exact affiché (ex. "QR non reconnu") et
le contenu exact du QR testé.
**PREUVE À RECUEILLIR** : photo de l'écran.

### Niveau 6 — Sélection d'une source
**BUT** : vérifier qu'on peut choisir depuis quel portefeuille payer.
**CE QUE JE DOIS FAIRE** : avoir au préalable lié au moins un portefeuille
(onglet Portefeuilles → Ajouter, choisir un opérateur, entrer un numéro — tout
numéro sauf `0000000000` fonctionne, c'est simulé exprès) ; continuer le
paiement jusqu'à l'écran de choix de source.
**CE QUE JE DOIS VOIR** : la liste des portefeuilles liés, sélectionnables.
**SI ÇA MARCHE** : Niveau 7.
**SI ÇA NE MARCHE PAS** : noter si la liste est vide alors qu'un portefeuille a
été ajouté, ou si l'appui ne fait rien.
**PREUVE À RECUEILLIR** : photo.

### Niveau 7 — Comportement Wave
**BUT** : documenter précisément ce qui se passe réellement quand la source
choisie est Wave, jusqu'au bout du parcours simulé.
**CE QUE JE DOIS FAIRE** : terminer le paiement avec Wave comme source.
**CE QUE JE DOIS VOIR** : un récapitulatif avec la commission, puis un écran
"On t'emmène chez Wave pour valider...", puis un résultat — **sans qu'aucune
vraie appli Wave ne s'ouvre** (c'est attendu et normal à ce stade, voir §10).
**SI ÇA MARCHE (comme décrit)** : c'est la confirmation que le comportement
observé en navigateur se reproduit sur téléphone — Niveau 8.
**SI ÇA NE MARCHE PAS** (ex. l'appli plante, ou au contraire l'appli Wave
s'ouvre vraiment sans qu'on l'ait prévu) : c'est une information importante à
remonter, dans un sens comme dans l'autre.
**PREUVE À RECUEILLIR** : photo de l'écran final (succès/échec).

### Niveau 8 — Comportement Orange Money
**BUT** : la même chose que le Niveau 7, mais avec Orange Money comme
opérateur/source, pour vérifier que rien de spécifique à Wave ne manque côté
Orange Money.
**CE QUE JE DOIS FAIRE / VOIR / SI ÇA MARCHE/NE MARCHE PAS** : identique au
Niveau 7, en remplaçant Wave par Orange Money.
**PREUVE À RECUEILLIR** : photo.

### Niveau 9 — Vrai QR marchand
**BUT** : la toute première confrontation du moteur de reconnaissance à un vrai
QR de paiement, jamais faite jusqu'ici (§9, §11).
**CE QUE JE DOIS FAIRE** : scanner un vrai QR affiché par un vrai commerçant
(Wave ou Orange Money), **sans valider aucun paiement réel** — s'arrêter juste
après l'écran de reconnaissance (Niveau 5), sans continuer jusqu'à la
confirmation.
**CE QUE JE DOIS VOIR** : soit l'opérateur correctement reconnu, soit un écran
"QR non reconnu" (`unrecognized.tsx`).
**SI ÇA MARCHE** : c'est la première preuve réelle que la reconnaissance
fonctionne en conditions réelles — noter le type de QR (Wave/Orange Money) et
si le montant a été lu correctement.
**SI ÇA NE MARCHE PAS** : recueillir, si possible, le contenu texte brut du QR
(par exemple via une appli de lecture de QR generique) pour permettre d'ajuster
la reconnaissance plus tard.
**PREUVE À RECUEILLIR** : photo de l'écran + si possible le texte brut du QR.
**IMPORTANT** : ne pas aller plus loin que cet écran avec un vrai QR marchand —
voir Niveau 10.

### Niveau 10 — Frontière avant argent réel
**BUT** : rappeler, au moment précis où la tentation existe (juste après avoir
scanné un vrai QR marchand), que la suite du parcours est entièrement simulée.
**CE QUE JE DOIS FAIRE** : **NE PAS** continuer un vrai QR marchand jusqu'à
"Confirmer le paiement" en pensant qu'un vrai paiement aura lieu — ça ne
débitera rien de réel, mais ça n'a aucun sens de le faire avec un vrai
commerçant en attente. Pour tester la suite du parcours (récapitulatif,
confirmation, résultat), utiliser un QR de test personnel, pas un vrai QR
marchand.
**CE QUE JE DOIS VOIR** : rien de plus à ce niveau — c'est un rappel, pas une
manipulation.
**PREUVE À RECUEILLIR** : aucune, ce niveau est une consigne de prudence.

---

## 17. Bloquants externes

- **Contrat opérateur** (Wave, Orange Money, ou un agrégateur agréé) — condition
  pour tout mouvement d'argent réel.
- **Compte marchand** réel chez chacun de ces opérateurs ou intermédiaires.
- **Accès API** réelles (identifiants techniques, environnements de test/prod)
  de ces mêmes acteurs.
- **Identifiants** (clés API, secrets) — n'existent pas dans ce dépôt et ne
  doivent jamais y être committés en clair.
- **Validation fournisseur** — toute API de paiement réelle impose un processus
  d'homologation avant mise en production.
- **Téléphone physique** — nécessaire pour tout le plan de vérification §16.
- **Vrai QR marchand** — nécessaire dès le Niveau 9 du plan de vérification.
- **Environnement réseau réel** (Wi-Fi partagé ordinateur/téléphone) — nécessaire
  dès le Niveau 1.
- **Compte Expo/EAS réel** — nécessaire pour produire un jour un lien de
  prévisualisation partageable ou un build installable (aujourd'hui : aucun
  compte configuré, voir §5, §9).

---

## 18. Questions encore ouvertes

**QUESTION** : le mécanisme `getAction`/`deeplink` (ouvrir l'appli officielle de
l'opérateur) doit-il être supprimé du code, ou réactivé un jour comme option
("payer via EasyPay" vs "ouvrir Wave directement") ?
**POURQUOI ELLE RESTE OUVERTE** : c'est un résidu de conception (§4), jamais
retiré ni explicitement conservé par une décision consciente.
**COMMENT LA TRANCHER** : décision de produit — c'est un choix de besoin ("est-ce
qu'on veut proposer les deux façons de payer ?"), pas une question technique.

**QUESTION** : faut-il ajouter une vraie traduction française, ou retirer le
sélecteur de langue hérité (anglais/arabe) tant qu'il ne sert à rien pour les
écrans EasyPay ?
**POURQUOI ELLE RESTE OUVERTE** : découverte pendant la rédaction de ce dossier,
jamais soulevée avant.
**COMMENT LA TRANCHER** : décision de produit simple ("veux-tu pouvoir changer la
langue de l'appli, ou est-ce que le français partout suffit ?").

**QUESTION** : que faire de `mobile_qr_payer/` (garder comme référence,
supprimer) ?
**POURQUOI ELLE RESTE OUVERTE** : posée depuis le tout début de la V2, jamais
tranchée.
**COMMENT LA TRANCHER** : décision de besoin, aucune conséquence technique
importante dans un sens ou dans l'autre.

**QUESTION** : quel fournisseur/agrégateur réel viser en premier pour brancher
`mockBackend.ts` sur un vrai réseau ?
**POURQUOI ELLE RESTE OUVERTE** : dépend de démarches commerciales externes à ce
dépôt, non commencées.
**COMMENT LA TRANCHER** : hors du champ technique — démarche commerciale/contractuelle
à mener par l'utilisateur (ou avec l'aide d'un accompagnement dédié).

**QUESTION** : le chiffre de "47 écrans" annoncé dans `PASSATION-EASYPAY.md` et
`easypay/README-project.md` — d'où vient l'écart avec les 43 fichiers d'écran
réellement présents (§7) ?
**POURQUOI ELLE RESTE OUVERTE** : les deux documents avancent un découpage par
parcours (9/10/12/5/5/6 = 47) qui ne correspond pas exactement au compte de
fichiers effectué pendant cet audit (8/1/10/11/4/9 = 43, en reclassant l'écran
Scanner et les écrans de paiement ensemble). Rien dans l'historique Git
n'indique explicitement 4 écrans supprimés après coup sans mise à jour du
chiffre — donc soit le chiffre de 47 comptait dès l'origine des choses qui
n'ont jamais été des fichiers séparés (ex. les deux états de l'écran KYC,
pending/verified, comptés comme 2), soit c'est une erreur de calcul non
corrigée.
**COMMENT LA TRANCHER** : relire ligne à ligne la spécification à 47 écrans
d'origine (si elle existe encore dans l'historique de conversation) face au
compte de fichiers de ce dossier, et corriger le chiffre dans la documentation
au chiffre exact et vérifiable.

---

## 19. Point exact de reprise

```
ÉTAT AUJOURD'HUI :
  43 écrans construits et reliés (V2, easypay/), contrôle de code sans erreur,
  18/18 tests du moteur QR verts, code secret désormais protégé (empreinte).
  Tout est simulé au-delà de la reconnaissance de QR et du stockage local.
  Jamais ouvert sur un vrai téléphone.

DERNIÈRE CHOSE RÉELLEMENT PROUVÉE :
  Le code secret n'est plus jamais écrit en clair dans le stockage local
  (vérifié en relisant le stockage après création du code, le jour de la
  rédaction de ce dossier).

PREMIÈRE CHOSE À FAIRE PAR L'UTILISATEUR :
  Niveau 1 du plan de vérification (§16) : ouvrir l'appli sur un vrai
  téléphone via Expo Go.

COMMANDE DE DÉMARRAGE :
  cd easypay && pnpm install && pnpm start

RÉSULTAT ATTENDU :
  Un QR code s'affiche dans le terminal ; le scanner avec Expo Go ouvre
  l'écran de bienvenue EasyPay sur le téléphone.

CE QU'IL NE FAUT SURTOUT PAS FAIRE POUR L'INSTANT :
  Scanner un vrai QR marchand et aller jusqu'à "Confirmer le paiement" en
  pensant qu'un vrai paiement aura lieu (voir §16, Niveau 10) — aucun argent
  ne bouge, mais ce n'est pas un geste à faire devant un vrai commerçant.
  Ne pas non plus tenter de créer un vrai compte Expo/EAS ou de publier un
  build sans en avoir discuté au préalable — cela sort du périmètre technique
  de ce dossier.
```

---

## 20. Sources de preuve

- **Historique Git complet** : `git log --oneline --all` (voir §13 pour la liste
  commentée des commits significatifs).
- **Fichiers supprimés retrouvables** : `git log --diff-filter=D --name-only --
  easypay mobile_qr_payer` (§3, §12).
- **Moteur de reconnaissance QR** : `easypay/src/core/emvco.ts`,
  `easypay/src/core/providers/*.ts`, tests dans
  `easypay/src/core/__tests__/emvco.test.ts` et
  `easypay/src/core/providers/__tests__/registry.test.ts`.
- **Moteur de paiement simulé** : `easypay/src/core/wallet-engine/mockBackend.ts`
  (commentaire de tête du fichier = déclaration explicite de simulation).
- **Stockage local** : `easypay/src/storage/{walletsState,authState,kycState,
  transactionsState}.ts`.
- **Code secret sécurisé** : `easypay/src/storage/authState.ts`, commit
  `4bda05f`.
- **Écrans** : arborescence complète sous `easypay/src/app/` (43 fichiers
  d'écran, hors `_layout.tsx`, `+html.tsx`, `[...messing].tsx`).
- **Absence de compte Expo/EAS réel** : `easypay/app.config.ts`
  (`EXPO_ACCOUNT_OWNER = undefined`, `EAS_PROJECT_ID = ''`).
- **Absence de traduction française** : `easypay/src/translations/` (seulement
  `en.json`, `ar.json`).
- **Résultats de tests** : ré-exécution de `pnpm test` et
  `pnpm run type-check` dans `easypay/`, et `npm test` dans `mobile_qr_payer/`,
  au moment de la rédaction de ce dossier.
- **Documents de passation antérieurs** (à lire comme documentation historique,
  avec les corrections apportées par ce dossier en tête, notamment sur le
  chiffre d'écrans, §18) : `PASSATION-EASYPAY.md` (racine du dépôt),
  `easypay/README-project.md`, `mobile_qr_payer/README.md`.
