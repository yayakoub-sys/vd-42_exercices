# Lecteur Paiement CI — v0 / MVP

Une appli mobile qui s'ouvre directement sur un lecteur de QR code. Elle scanne un QR
de paiement, reconnaît tout de suite à quel opérateur il appartient (Wave, Orange
Money…), et ouvre automatiquement la bonne appli officielle pour que tu termines le
paiement avec ton code secret habituel.

## Ce qui marche déjà (testé)

- Le "cerveau" qui lit et reconnaît les QR codes (fichiers dans `src/core/`) est testé
  automatiquement : 22 tests, tous verts. Pour les relancer : `npm test`.
- **Wave** : reconnaissance et ouverture confirmées. Un QR Wave contient directement
  un lien officiel (`pay.wave.com/...`) ; l'appli l'ouvre tel quel.
- Le format des QR **Orange Money** (et de beaucoup d'autres) suit un standard ouvert
  et documenté (EMVCo) : l'appli sait le lire, en extraire le montant, le nom du
  commerçant, etc.
- Un écran d'accueil explique l'appli une seule fois, au tout premier lancement
  (ensuite elle s'ouvre directement sur le lecteur, comme demandé).
- Un **historique** garde tes 20 derniers QR scannés (opérateur, marchand, montant,
  heure) — accessible via le bouton "Historique" en haut de l'écran caméra. Il reste
  sur le téléphone, rien n'est envoyé ailleurs.
- Une icône et des couleurs propres à l'appli (plus les images par défaut du modèle
  de départ).

## Ce qui est "best effort" — pas encore confirmé sur un vrai téléphone

- Le lien qui ouvre directement l'appli Orange Money après un scan (`orangemoney://`)
  est une tentative raisonnable, pas une certitude : je n'ai pas eu de vrai QR Orange
  Money sous la main pour le vérifier. Si ça ne s'ouvre pas tout seul, l'appli te dira
  d'ouvrir Orange Money toi-même — rien n'est bloqué, c'est juste un clic de plus en
  attendant.
- Dès qu'un vrai QR Orange Money (ou MTN Momo, Moov Money…) est scanné, l'appli
  affichera son contenu si elle ne le reconnaît pas avec certitude : il suffira de me
  transmettre ça pour que je fiabilise la reconnaissance à 100 %.

## Comment le tester toi-même, sur ton téléphone

Pas besoin d'installer de logiciel compliqué :

1. Sur ton téléphone, installe l'appli gratuite **Expo Go** (Play Store / App Store).
2. Sur un ordinateur qui a ce projet, dans le dossier `mobile_qr_payer`, lance :
   ```
   npm install
   npm start
   ```
3. Un QR code apparaît dans le terminal : scanne-le avec l'appli **Expo Go** (Android)
   ou avec l'appareil photo (iPhone). L'appli se lance directement sur le lecteur.

## Prochaines étapes possibles (à valider avec toi, ce sont des choix, pas des blocages)

- Ajouter MTN Money, Moov Money, dès qu'on a un vrai QR de chacun à tester.
- Brancher un vrai débit automatique (au lieu d'ouvrir l'appli officielle) : c'est
  prévu, voir `src/core/providers/futureAggregatorProvider.example.ts` — ça demande un
  accord commercial avec un agrégateur qui a les API de prélèvement, pas du code
  supplémentaire compliqué de notre côté.
- Ajuster le nom affiché de l'appli si tu en veux un autre (aujourd'hui : "Lecteur
  Paiement CI", facile à changer dans `app.json`).

## Pour comprendre le code (repères techniques)

- `src/core/emvco.ts` : lecture du format standard des QR de paiement (EMVCo).
- `src/core/providers/` : un fichier par opérateur (`wave.ts`, `orangeMoney.ts`...),
  plus `registry.ts` qui décide lequel reconnaît le QR scanné. Pour ajouter un
  nouvel opérateur demain, il suffit d'ajouter un fichier ici et de l'inscrire dans
  `registry.ts` — rien d'autre à toucher.
- `src/screens/` : accueil (`OnboardingScreen.tsx`), caméra (`ScannerScreen.tsx`),
  résultat (`ResultScreen.tsx`), historique (`HistoryScreen.tsx`).
- `src/storage/appState.ts` : mémorise sur le téléphone "l'accueil a déjà été vu" et
  la liste des derniers scans.
- `assets/` : icône et couleurs de l'appli, générées avec un petit script (pas de
  fichier externe utilisé).
