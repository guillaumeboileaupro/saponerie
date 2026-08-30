---
name: security-best-practices
description: Examiner explicitement la sécurité de La Saponnerie, notamment les entrées, données SAP, stockage local, dépendances et permissions Tauri.
---

# Sécurité du projet

## Contrôles

- valider toutes les valeurs numériques et unités ;
- refuser valeurs négatives, non finies et hors limites ;
- versionner et tracer la provenance des tables SAP ;
- échapper le contenu importé et ne jamais exécuter de données utilisateur ;
- éviter les secrets dans le dépôt et dans le frontend ;
- maintenir une CSP restrictive ;
- accorder à Tauri uniquement les capacités indispensables ;
- auditer npm et Cargo sans appliquer aveuglément les mises à jour majeures ;
- vérifier les licences et l’intégrité des dépendances.

## Revue

Classer les constats en critique, élevé, moyen et faible. Pour chaque constat, donner preuve, impact, correction et test de non-régression. Ne modifier le comportement métier sensible qu’avec des tests de référence.