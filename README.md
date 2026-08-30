# La Saponnerie

Application de bureau pour composer une recette de savon et calculer les quantités de corps gras, de soude et d’eau.

## Objectif

- proposer une interface claire et moderne ;
- sélectionner les ingrédients dans une liste documentée ;
- calculer la quantité de NaOH ou de KOH à partir des indices SAP ;
- appliquer le surgraissage et la concentration choisie ;
- produire des versions installables Ubuntu `.deb` et Windows `.exe`.

> **Sécurité :** les résultats devront être vérifiés et accompagnés d’avertissements. La soude est corrosive et les données SAP peuvent varier selon la matière première.

## Skills du projet

Les mêmes workflows sont disponibles pour :

- Codex dans `.agents/skills/` ;
- Claude Code dans `.claude/skills/`.

Skills inclus : métier de la saponification, design de l’interface, développement Tauri, tests Playwright, sécurité et diagnostic GitHub Actions.

## Sources des skills techniques

Le socle est adapté au projet à partir des bonnes pratiques publiques de :

- https://github.com/full-stack-skills/tauri-skills
- https://github.com/anthropics/skills
- https://github.com/openai/skills
- https://github.com/microsoft/playwright-cli
