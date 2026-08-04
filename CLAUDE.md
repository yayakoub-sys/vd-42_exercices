# Profil de collaboration — à lire au début de CHAQUE session

Ce fichier est le mode d'emploi de Claude pour ce dépôt. Il se charge automatiquement.
Il dit **comment travailler**.

- Où en est le travail → [ETAT.md](ETAT.md)
- Quoi lire, et dans quel ordre → [CARTE.md](CARTE.md)
- Quoi vérifier avant et après d'agir → [GATE.md](GATE.md)

---

## Qui est l'utilisateur

L'utilisateur **n'est pas technicien**. Il connaît parfaitement son **besoin** (ce qui marche
ou pas, ce qui est logique ou pas), mais **pas** le vocabulaire technique. Il faut respecter
ça en permanence.

## Contrat de communication (obligatoire)

1. **Mots simples, images concrètes.** Jamais de jargon. Si un terme technique est
   indispensable, l'expliquer en une phrase avec une comparaison du quotidien.
2. **Ne jamais poser de question technique à l'utilisateur.** C'est à Claude de chercher la
   bonne méthode et les bonnes briques (sur Internet si besoin) et de **décider**. On ne
   demande à l'utilisateur que des choix de **besoin** (le « quoi »), jamais de **technique**
   (le « comment »).
3. **Structurer chaque réponse importante ainsi :**
   - ✅ **Ce que j'ai fait** (fini et vérifié)
   - 🔜 **Ce qui reste**
   - 🙋 **Ce que j'attends de toi** (une décision simple, ou rien)
4. **Avant toute proposition : revue des angles morts + pré-mortem.** Vérifier chaque point
   pour les règles oubliées, les incohérences, ce qui pourrait casser — et le dire.
5. **Honnêteté sur les résultats.** 1 = ça marche, 0 = ça a bloqué (et alors : pourquoi, et
   quelle solution). Pas de demi-vérité. Toujours distinguer **vérifié** de **supposé**.

---

## Où s'exécute Claude — ⚠️ ceci a changé

**Claude s'exécute désormais DIRECTEMENT sur le PC Windows de l'utilisateur.**

Constaté le 2026-08-04 : Claude lit et écrit sur `C:`, lance PowerShell, pilote `adb` et
l'émulateur Android, et **voit le disque externe** (`H:`, `F:`, `E:`, `G:`).

L'ancienne règle de ce fichier — « atelier cloud, le PC et le disque yayakoub sont invisibles
pour Claude » — est **périmée**. Ne plus la répéter à l'utilisateur : elle est fausse, et elle
l'induirait en erreur sur ce que Claude peut réellement faire, vérifier et casser.

Ce que cela change concrètement :
- Claude peut **vérifier lui-même** au lieu de demander. Il doit le faire.
- Claude peut aussi **détruire pour de vrai**. Avant toute suppression ou écrasement :
  regarder ce qu'on supprime, et le dire.
- Les chemins absolus du poste sont utilisables et fiables.

---

## Ce dépôt contient TROIS projets séparés

Ne jamais les confondre. Un fichier à la racine ne parle pas forcément du projet en cours.

| Projet | Dossiers | Ce que c'est | État |
|---|---|---|---|
| **easypay** | `easypay/` — 280 fichiers | Portefeuille de paiement universel (React Native / Expo) | 🔨 **Chantier en cours** |
| **docengine** | `docengine/`, `web/`, `templates/`, `tests/` — 17 fichiers | Moteur local d'extraction de documents (Python, sans IA) | ⏸️ En pause |
| **mobile_qr_payer** | `mobile_qr_payer/` — 39 fichiers | Premier lecteur de QR (cœur EMVCo) | 📦 Antérieur à easypay |

**Branche de travail actuelle : `claude/universal-qr-code-reader-4cdw9s`** (chantier easypay).
Branche principale : `claude/web-app-document-processing-na5del`.

---

## Règles dures — ne pas les enfreindre

### EasyPay / Android

- ❌ **Ne JAMAIS lancer** `expo prebuild`, `expo run:android`, `pnpm prebuild`, `pnpm android`.
  Ces commandes régénèrent `easypay/android/` et effacent quatre des cinq correctifs sans
  lesquels le build ne passe pas sur ce poste.
  Réparation si c'est arrivé : `git checkout -- easypay/android`.
- ✅ `easypay/android/` est une **source versionnée**, pas un dossier généré.
- ✅ Build natif : bouton ▶ Run d'Android Studio, ou
  `cd easypay/android && ./gradlew :app:assembleDebug`.
- ✅ Changement JavaScript / TypeScript : **rien à reconstruire**, Metro et Fast Refresh suffisent.
- ❌ **Ne pas créer un second émulateur.** Il doit rester un seul AVD : `Pixel_8_API_35`.
- ❌ **Ne pas vider le dossier `Temp` de Windows** : Metro y garde son cache.

Boucle quotidienne complète et non technique : [easypay/BOUCLE-ANDROID.md](easypay/BOUCLE-ANDROID.md).

### Machine

Le poste est **petit et contraint** : 7,8 Go de mémoire, `C:` structurellement à l'étroit,
et `H:`/`F:`/`E:`/`G:` sont des partitions d'un **disque externe USB mécanique**, dix fois
plus lent que `C:`. Vérifier l'espace disque **avant** tout build. Voir [GATE.md](GATE.md).

### Git

- Commiter en français ; un sujet par commit ; expliquer la **raison**, pas seulement le quoi.
- **Ne pousser que si l'utilisateur le demande.**

---

## Rappel de méthode

Quand un symptôme n'a pas de sens (délai dépassé, écran blanc, « ne répond pas »),
**chercher la cause réelle avant de conclure que la machine est trop petite**.

Sur ce poste, quatre pannes de suite avaient des causes sans aucun rapport visible avec leur
symptôme : un espace dans le nom d'utilisateur, la limite Windows des 260 caractères, un
codegen produisant des chemins de 448 caractères, et un plantage en boucle de Google Play
Services. Chaque fois, l'explication facile (« machine saturée ») était fausse.
