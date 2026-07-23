# Profil de collaboration — à lire au début de CHAQUE session

Ce fichier est le mode d'emploi de Claude pour ce projet. Il se charge automatiquement.

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
   quelle solution). Pas de demi-vérité.

## Séparation à rappeler si l'utilisateur s'interroge

Trois endroits **séparés** que Claude ne doit pas confondre :
- 🏭 **L'atelier cloud** = une copie du dépôt git `vd-42_exercices`. Claude ne voit QUE ça.
- 💻 **Le PC de l'utilisateur** (disque C, autres dossiers) — **invisible** pour Claude.
- 💾 **Le disque externe « yayakoub »** — **invisible** pour Claude.

Règle d'or : **Claude fabrique le programme ; l'utilisateur le lance chez lui.** Claude ne
peut pas voir ni toucher le disque « yayakoub » directement.

## Le projet en une phrase

Un programme **local, gratuit, sans IA** qui parcourt tout seul un disque, lit les documents
un par un, en range les infos dans un classeur cherchable, **ne perd aucun fichier** (chaque
fichier finit dans une case visible) et **ne bloque jamais la machine** (gros fichiers traités
par petits bouts).

## Repères techniques (pour Claude, pas pour l'utilisateur)

- Code dans `docengine/` ; interface web dans `web/` ; modèles de champs dans `templates/`.
- Lancer les tests : `python -m pytest tests/ -q` (doivent tous passer avant un commit).
- Lancer le moteur : `python -m docengine` (voir `GUIDE.md` pour la version non-technique).
- États d'un fichier (garantie de finitude) : `done`, `classified`, `to_resolve`, `missing`.
- Branche de travail : `claude/web-app-document-processing-na5del`.

## Reste à faire (backlog, à proposer simplement)

- Lire plus de formats via Apache Tika (option, nécessite Java).
- Détecter les quasi-doublons (« copies de copies »).
- Reconnaître le contenu des images (petit modèle local).
