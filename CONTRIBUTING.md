# Contribuer

## Avant de commencer

Lire `AGENTS.md` ou `CLAUDE.md`, puis `docs/PROJECT_CONTEXT.md`.

## Branche et changements

- une branche par sujet ;
- changements petits et cohérents ;
- pas de mélange entre refonte visuelle, formule métier et maintenance ;
- aucune donnée SAP sans source ;
- aucun changement de formule sans tests.

## Qualité

Avant une pull request :

- formatage ;
- lint ;
- vérification TypeScript stricte ;
- tests unitaires ;
- tests d’intégration concernés ;
- build de l’application si la pile est initialisée.

## Commits

Messages courts, en français ou en anglais cohérent, de préférence au format Conventional Commits :

- `feat:`
- `fix:`
- `test:`
- `docs:`
- `chore:`

## Pull request

La description précise :

- le besoin ;
- le comportement modifié ;
- les tests effectués ;
- les captures pour une modification visuelle ;
- les risques ou données restant à vérifier.

Aucune fusion automatique sans validation de Guillaume.
