# 0004 — Stockage local et migrations

- Date : 2026-08-30
- Statut : accepté

## Contexte

Les recettes doivent être sauvegardées localement, dupliquées, rechargées sans perte, et rester utilisables après une mise à jour de l'application (`docs/PROJECT_CONTEXT.md` §9 et §11). Le stockage doit fonctionner hors ligne et ne pas dépendre du moteur de calcul.

## Options étudiées

- **SQLite (via `rusqlite` côté Rust, ou plugin SQL Tauri)** : transactionnel, migrations versionnées faciles à tester, adapté à un futur historique de versions de recette (post-MVP).
- **Fichiers JSON par recette sur disque** : plus simple à inspecter/déboguer manuellement, mais gestion de migration et d'intégrité (écritures partielles) plus fragile à long terme.

## Décision

Utiliser **SQLite**, embarqué côté Rust (`src-tauri`), avec des migrations versionnées explicites (une migration = un fichier numéroté, jamais réécrite après publication). Le schéma initial couvre `Recipe`, `RecipeIngredient` et une référence à la version du jeu de données SAP utilisée (`dataSetVersion`), conformément au modèle de données §10 de `PROJECT_CONTEXT.md`.

## Conséquences

- Le stockage reste une couche séparée du moteur de calcul (`core/`) : il persiste des entrées et des résultats, il ne recalcule rien lui-même de façon divergente.
- Chaque migration doit avoir un test vérifiant qu'une base créée avec une version antérieure du schéma reste lisible après mise à jour.
- Le format d'export/import JSON (post-MVP) peut réutiliser le schéma des entités sans dépendre du détail du stockage SQLite.
