# La Saponnerie

Application de bureau hors ligne pour composer une recette de savon et calculer les quantités de corps gras, de soude et d’eau.

## Objectif

- proposer une interface claire, moderne et accessible ;
- sélectionner les ingrédients dans une liste documentée ;
- calculer la quantité de NaOH à partir des indices SAP ;
- appliquer le surgras, la pureté de la soude et la méthode de calcul de l’eau ;
- sauvegarder et exporter les recettes ;
- produire des versions installables Ubuntu `.deb` et Windows `.exe`.

> **Sécurité :** les résultats devront être vérifiés et accompagnés d’avertissements. La soude est corrosive et les données SAP peuvent varier selon la matière première.

## État

Le projet est en phase de cadrage. La pile proposée est Tauri 2 + React + TypeScript, mais elle doit être confirmée avant l’implémentation.

## Travailler avec Codex et Claude

- Codex commence par [AGENTS.md](AGENTS.md).
- Claude Code commence par [CLAUDE.md](CLAUDE.md).
- Les deux utilisent [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) comme source métier commune.
- Les décisions structurantes sont consignées dans [docs/decisions/README.md](docs/decisions/README.md).

## Documentation

- [Contexte fonctionnel et métier](docs/PROJECT_CONTEXT.md)
- [Architecture proposée](docs/ARCHITECTURE.md)
- [Sources et provenance](docs/SOURCES.md)
- [Plan de travail](TODO.md)
- [Règles de contribution](CONTRIBUTING.md)

## Skills du projet

Les workflows spécialisés sont destinés à être installés dans :

- `.agents/skills/` pour Codex ;
- `.claude/skills/` pour Claude Code.

Ils ne doivent pas dupliquer les formules ni les règles métier : celles-ci restent centralisées dans `docs/PROJECT_CONTEXT.md`.

## Licence

À choisir avant la première diffusion publique.
