# Plan de travail

## P0 — Cadrage et fiabilité

- [x] Valider le nom affiché « La Saponnerie » et l’orthographe du dépôt.
- [x] Valider Tauri 2 + React + TypeScript — voir [ADR 0001](docs/decisions/0001-pile-tauri-react-typescript.md).
- [x] Choisir le langage du moteur de calcul — Rust, voir [ADR 0002](docs/decisions/0002-langage-moteur-decimal.md).
- [x] Choisir une représentation décimale — `rust_decimal`, voir [ADR 0002](docs/decisions/0002-langage-moteur-decimal.md).
- [ ] Vérifier et sourcer les indices SAP NaOH — croisement effectué le 2026-08-30 (voir `docs/SOURCES.md`) ; 18/20 valeurs `cross_checked`, 2 restent `documentary` (pépin de raisin, coco) et 3 points restent à trancher par Guillaume.
- [x] Fixer les bornes du surgras, de la pureté et des méthodes d’eau — proposition dans `docs/PROJECT_CONTEXT.md` §4.6, implémentée et testée dans `core/`, **à confirmer définitivement par Guillaume**.
- [ ] Valider les avertissements de sécurité — texte proposé en §6 de `docs/PROJECT_CONTEXT.md`, relecture humaine/experte encore requise avant publication.
- [x] Créer les ADR correspondants — `docs/decisions/0001` à `0005`.

## P1 — Moteur

- [x] Définir les types métier — `core/src/types.rs`.
- [x] Implémenter NaOH théorique — `core/src/calculation.rs`.
- [x] Implémenter réduction de soude et correction de pureté — `core/src/calculation.rs`.
- [x] Implémenter les trois méthodes d’eau — `core/src/calculation.rs`.
- [x] Implémenter validations et avertissements — `core/src/validation.rs`.
- [x] Couvrir les quatre cas de référence documentaires — `core/src/tests.rs` (cas A à D, 20 tests, tous verts).

## P2 — Application

- [ ] Initialiser Tauri.
- [ ] Créer l’éditeur de recette.
- [ ] Créer le sélecteur d’ingrédients.
- [ ] Afficher résultats et hypothèses.
- [ ] Sauvegarder et dupliquer localement.
- [ ] Ajouter impression ou export PDF.
- [ ] Ajouter accessibilité clavier et contraste AA.

## P3 — Distribution

- [ ] CI Linux et Windows.
- [ ] Générer et tester le `.deb`.
- [ ] Générer et tester le `.exe`.
- [ ] Documenter installation et désinstallation.
- [ ] Choisir licence et politique de publication.

## Plus tard

- [ ] Ingrédients personnalisés.
- [ ] Import/export JSON.
- [ ] Additifs, argiles et exfoliants.
- [ ] Module KOH séparé.
- [ ] Profils d’acides gras avec sources vérifiées.
