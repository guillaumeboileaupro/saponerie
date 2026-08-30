---
name: gh-fix-ci
description: Diagnostiquer les échecs GitHub Actions de La Saponnerie, notamment tests, builds Tauri Linux/Windows et génération des installateurs.
---

# Diagnostic CI

1. Identifier le workflow, le job, le runner et le premier échec utile.
2. Lire les logs et distinguer cause racine des erreurs en cascade.
3. Reproduire localement lorsque la plateforme le permet.
4. Proposer une correction concise avant de modifier le code.
5. Exécuter les tests concernés puis revérifier le workflow.

Pour les builds Tauri, contrôler séparément dépendances système Linux, toolchain Rust, cache, frontend, configuration de bundle et signature Windows. Ne jamais masquer un test en échec ni remplacer une version par latest pour faire passer la CI.