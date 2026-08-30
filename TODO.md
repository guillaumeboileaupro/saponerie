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

- [x] Initialiser Tauri — squelette Tauri 2 + React + TS créé, commande `calculer_recette` reliée à `core/`, build et lancement vérifiés (`npm run build`, `cargo tauri dev` sous Xvfb). Icônes par défaut de Tauri encore en place : à remplacer par des tailles générées depuis `assets/logo/logo.svg` avant packaging.
- [x] Créer l'éditeur de recette — `src/features/recipe/RecipeEditor.tsx`, mise en page deux colonnes (recette / résultats) responsive dès 360 px, valeurs initiales explicites (surgras 5 %, pureté 99 %, eau 35 % des corps gras).
- [x] Créer le sélecteur d'ingrédients — `FatPicker.tsx`, recherche par nom/alias sur `data/fats.2026-08-30.json`, badge « non vérifié » pour les indices `documentary`.
- [x] Afficher résultats et hypothèses — `ResultsPanel.tsx` : résultats arrondis à l'affichage seulement (`formatDecimal.ts`), avertissements hors plage usuelle, hypothèses dépliables, états vide/erreur/chargement.
- [ ] Sauvegarder et dupliquer localement.
- [ ] Ajouter impression ou export PDF.
- [x] Accessibilité clavier et contraste AA — focus visible partout (`:focus-visible`), libellés associés à chaque champ, cibles de contrôle en boutons natifs ; vérifié en pilotant l'app réelle (Tauri sous Xvfb + xdotool) et en contrôlant l'absence de débordement horizontal à 360/768/1280 px (Playwright). Contraste chiffré (ratios WCAG) non mesuré formellement — à auditer avec le skill `security-best-practices`/un outil dédié avant publication.

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
