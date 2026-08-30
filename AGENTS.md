# Instructions Codex — La Saponnerie

## Lecture obligatoire

Avant toute action, lire dans cet ordre :

1. `AGENTS.md` ;
2. `docs/PROJECT_CONTEXT.md` ;
3. `docs/ARCHITECTURE.md` ;
4. le ou les `SKILL.md` applicables à la tâche ;
5. les fichiers concernés et l’état Git.

Les règles situées dans un `AGENTS.md` plus proche d’un sous-dossier complètent ou remplacent celles-ci.

## Source commune

`docs/PROJECT_CONTEXT.md` est la source de vérité fonctionnelle et métier commune à Codex et Claude. Ne pas recopier les formules ou la table SAP dans ce fichier.

## Règles impératives

- Ne jamais inventer un indice SAP, une propriété cosmétique ou une règle de sécurité.
- Toujours distinguer SAP NaOH et SAP KOH.
- Afficher la source et la version des données utilisées.
- Calculer avec une représentation décimale adaptée et arrondir seulement à l’affichage.
- Toute modification d’une formule exige des tests unitaires et des cas de non-régression.
- Le moteur de calcul reste indépendant de l’interface et du stockage.
- Ne pas utiliser `any` en TypeScript.
- Ne pas ajouter de télémétrie ni de dépendance réseau au calcul.
- Ne jamais conseiller de goûter ou lécher un savon.
- Ne jamais commit, push, merge, publier ou modifier une release sans demande explicite de Guillaume.
- Avant toute modification structurante, proposer un plan court et indiquer les compromis.
- Préserver les changements existants ; ne pas réécrire des fichiers sans nécessité.

## Méthode

1. Inspecter.
2. Formuler l’hypothèse et le plan.
3. Modifier par petits changements cohérents.
4. Lancer les tests et contrôles adaptés.
5. Résumer précisément les fichiers touchés, les vérifications réussies et ce qui reste à faire.

## Critères de fin

Une tâche n’est terminée que si :

- le comportement demandé est implémenté ;
- les erreurs et cas limites sont couverts ;
- les tests pertinents passent ;
- la documentation est cohérente ;
- aucune donnée métier non vérifiée n’est présentée comme certaine.
