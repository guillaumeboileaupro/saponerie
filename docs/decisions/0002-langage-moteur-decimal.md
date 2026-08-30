# 0002 — Langage du moteur de calcul et représentation décimale

- Date : 2026-08-30
- Statut : accepté

## Contexte

Le moteur de calcul (NaOH théorique, surgras, pureté, eau) doit être pur, indépendant de l'UI et du stockage, déterministe, et produire les mêmes résultats sur Windows et Ubuntu. Les flottants binaires (`f64`/`number`) peuvent introduire des écarts d'arrondi indésirables sur des calculs financiers/pondéraux enchaînés.

## Options étudiées

- **Rust, avec `rust_decimal`** : partage possible avec le cœur Tauri (`src-tauri`), type `Decimal` à précision fixe (pas de dérive binaire), bonne performance, tests unitaires natifs (`cargo test`).
- **TypeScript pur, avec `decimal.js`** : un seul langage pour tout le projet, itération plus rapide côté UI, mais duplication potentielle de logique si le pont Tauri a aussi besoin de valider côté Rust.

## Décision

Le moteur de calcul est écrit en **Rust**, sous forme de crate de bibliothèque indépendante `core/`, sans dépendance vers `tauri`, `react` ou une couche de stockage. La représentation décimale utilise `rust_decimal` (type `Decimal`) pour tous les calculs internes ; les conversions vers des types d'affichage (arrondis, formatage) n'interviennent qu'à la frontière UI.

## Conséquences

- `src-tauri` expose les fonctions de `core/` via des commandes Tauri (`#[tauri::command]`), sans dupliquer la logique métier.
- Les tests de référence (cas A à D de `docs/PROJECT_CONTEXT.md` §11.1) sont écrits en `cargo test` dans `core/`.
- Le dépôt nécessite un toolchain Rust (`rustup`, `cargo`) pour construire et tester le moteur ; à installer sur les machines de développement et dans la CI.
- Aucun calcul métier ne doit être ré-implémenté côté TypeScript ; l'UI ne fait qu'afficher les résultats renvoyés par `core/`.
