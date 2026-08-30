# Instructions Claude Code — La Saponnerie

## Lecture obligatoire

Avant toute action, lire dans cet ordre :

1. `CLAUDE.md` ;
2. `docs/PROJECT_CONTEXT.md` ;
3. `docs/ARCHITECTURE.md` ;
4. le ou les skills applicables dans `.claude/skills/` ;
5. les fichiers concernés et l’état Git.

## Source commune

`docs/PROJECT_CONTEXT.md` est la source de vérité fonctionnelle et métier commune à Claude et Codex. Les formules, jeux de données et exigences de sécurité ne doivent pas être dupliqués ici.

## Règles impératives

- Ne jamais inventer un indice SAP, une propriété cosmétique ou une règle de sécurité.
- Distinguer strictement SAP NaOH et SAP KOH.
- Conserver la provenance et la version de chaque donnée métier.
- Employer des calculs décimaux fiables ; arrondir seulement pour l’affichage.
- Accompagner toute modification d’une formule par des tests.
- Séparer moteur de calcul, validation, UI et persistance.
- Ne pas utiliser `any` en TypeScript.
- L’application doit fonctionner hors ligne ; aucune télémétrie par défaut.
- Ne jamais conseiller de goûter ou lécher un savon.
- Ne jamais commit, push, merge ou publier une release sans demande explicite de Guillaume.
- Proposer les choix structurants avant de les appliquer.
- Préserver les changements existants et éviter les réécritures inutiles.

## Méthode attendue

Inspecter le dépôt, annoncer un plan court, réaliser des changements limités, vérifier avec les tests adaptés, puis résumer le résultat et les limites restantes.
