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

## P0 — Corrections requises avant diffusion

- [x] Compléter chaque entrée SAP avec ses références exactes, sa version/date de vérification et son statut. Afficher systématiquement la source et la version du jeu de données dans l'éditeur, les résultats et les exports. — `data/fats.2026-08-30.json` : `verifiedAt` et `crossCheckNote` renseignés pour les 18 entrées `cross_checked` (sources nommées : SoapCalc, Alfa Chemistry, The Soap Kitchen UK, From Nature With Love, Soaper's Choice). Version du jeu de données affichée en permanence dans l'éditeur et les hypothèses de résultat ; provenance de chaque ingrédient en infobulle (plus seulement pour les non vérifiés) ; `source`/`status`/`verifiedAt` inclus dans les exports JSON.
- [x] Restreindre les capacités Tauri d'import/export aux seuls fichiers choisis par l'utilisateur ; supprimer les autorisations globales de lecture et d'écriture sur `$HOME/**`. — `tauri-plugin-fs` retiré ; remplacé par deux commandes Rust dédiées (`lire_fichier_recette`/`ecrire_fichier_recette`, `src-tauri/src/recipe_files.rs`) qui n'exigent aucune portée statique : le chemin vient uniquement de la boîte de dialogue native. `capabilities/default.json` ne déclare plus que `core:default`, `opener:default`, `dialog:default`.
- [x] Définir et tester une CSP Tauri restrictive à la place de `"csp": null`. — `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src ipc: http://ipc.localhost`, vérifiée sans erreur dans l'app réelle (aucun style inline dans le code).
- [x] Renforcer la validation des imports JSON : version de format prise en charge, méthodes d'eau et catégories autorisées, décimaux valides, longueurs, nombre d'éléments et taille maximale du fichier. — `recipeFile.ts` : `formatVersion` exact, `waterMode.kind`/catégorie d'additif dans une liste fermée, tous les décimaux validés syntaxiquement, chaînes et tableaux plafonnés (200 caractères/éléments) ; `recipe_files.rs` plafonne aussi la taille du fichier lu à 5 Mo.
- [x] Distinguer les erreurs métier du moteur des erreurs techniques IPC ; ne plus convertir aveuglément toute erreur Tauri en `ValidationError[]` et couvrir le cas par un test. — `isValidationErrorArray` (`core/types.ts`) distingue les deux ; `calculateRecipe` renvoie `kind: "validation" | "technical"` ; l'UI affiche un message dédié pour une erreur technique.
- [ ] Ajouter une suite de tests frontend et Playwright versionnée : recette vide, calcul valide/invalide, changement de méthode d'eau, import malformé, sauvegarde/réouverture, duplication, suppression et navigation clavier aux largeurs 360, 768 et 1280 px.
- [ ] Ajouter les tests frontend et Playwright à la CI, avec capture et trace en cas d'échec.
- [x] Auditer les dépendances npm et Cargo, documenter les résultats et traiter les vulnérabilités applicables sans mise à jour majeure aveugle. — `docs/DEPENDENCY_AUDIT.md` : 0 vulnérabilité npm ; `cargo audit` trouve `RUSTSEC-2026-0235` (rkyv) mais la feature correspondante de `rust_decimal` n'est pas activée (code jamais compilé) ; 17 avertissements « non maintenu » viennent de la chaîne Tauri/wry/gtk-rs, hors de notre contrôle sans mise à jour majeure de Tauri.
- [ ] Faire exécuter localement `cargo fmt --all -- --check`, `cargo clippy --workspace --all-targets -- -D warnings` et `cargo test --workspace` sur une machine équipée de Rust, en complément du résultat CI.

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
- [x] Sauvegarder et dupliquer localement — SQLite via `rusqlite` (bundled), schéma + migrations versionnées dans `src-tauri/src/storage.rs` (ADR 0004), commandes Tauri `sauvegarder_recette`/`lister_recettes`/`charger_recette`/`dupliquer_recette`/`supprimer_recette`. Base dans le dossier de données de l'application (par utilisateur/OS). 9 tests Rust (migrations, CRUD, duplication, suppression en cascade) + vérification manuelle complète dans l'app réelle.
- [ ] Ajouter impression ou export PDF, avec les hypothèses, la source/version des données et les avertissements de sécurité.
- [ ] Demander une confirmation explicite avant d'afficher ou d'imprimer la fiche de fabrication finale.
- [x] Ajouter les bases d'accessibilité clavier — focus visible (`:focus-visible`), libellés associés et contrôles natifs ; absence de débordement horizontal vérifiée à 360/768/1280 px.
- [ ] Mesurer formellement les contrastes WCAG AA, corriger les écarts et conserver le rapport ou les tests reproductibles dans le dépôt.

## P3 — Distribution

- [x] CI Linux et Windows — `.github/workflows/ci.yml` : job `quality` (fmt, clippy, tests Rust, build TS) puis job `build` en matrice Linux/Windows via `tauri-apps/tauri-action`, `--bundles` explicite par plateforme (ADR 0005). Validé avec `actionlint` **et par une exécution réelle sur GitHub** (run [33324348711](https://github.com/guillaumeboileaupro/saponerie/actions/runs/33324348711)) : les deux jobs passent et publient chacun un artefact réel (`.deb` ~5,5 Mo, `.exe` NSIS ~3 Mo). Un premier run passait au vert sans jamais publier d'artefact (mauvais chemin + bundles non restreints) — corrigé après lecture des logs réels, pas supposé correct.
- [x] Générer et tester le `.deb` — build release, icônes régénérées depuis `assets/logo/logo.svg`, `dpkg -i` puis lancement réel de l'app installée (retrouve la base SQLite existante), puis `dpkg --purge` : cycle complet vérifié sur cette machine.
- [ ] Générer et tester le `.exe` — produit par la CI sur un runner Windows réel (voir ci-dessus), **non testé manuellement sur une machine Windows** (impossible depuis Linux, voir skill `tauri-desktop`) : à faire avant toute diffusion.
- [x] Documenter installation et désinstallation — `docs/INSTALLATION.md`.
- [x] Choisir licence et politique de publication — GPL-3.0-or-later, choisie par Guillaume. Fichier `LICENSE` ajouté, champ `license` renseigné dans `package.json`, `core/Cargo.toml` et `src-tauri/Cargo.toml`.

## Plus tard

- [x] Ingrédients personnalisés — formulaire `CustomFatForm.tsx`, persistés dans le stockage local du navigateur (`userFatsStorage.ts`, provisoire en attendant SQLite/ADR 0004), toujours affichés « non vérifié ».
- [x] Import/export JSON — `recipeFile.ts` via `@tauri-apps/plugin-dialog` + `plugin-fs` ; fichier auto-porteur (embarque la définition des ingrédients personnalisés) ; validation structurelle du fichier importé avant usage. Vérifié en conditions réelles (export puis réimport dans l'app).
- [x] Additifs, argiles et exfoliants — `AdditiveTable.tsx` : nom, catégorie, masse, totalement séparés du calcul NaOH/eau. Le remplacement d'une partie de l'eau par un liquide (lait, infusion) n'est **pas** pris en charge, signalé explicitement dans l'UI pour éviter tout double comptage.
- [ ] Module KOH séparé — non traité (hors périmètre de cette itération).
- [ ] Profils d'acides gras avec sources vérifiées — recherche exploratoire faite, **données jugées insuffisamment fiables/complètes pour intégration** (voir `docs/FATTY_ACID_PROFILES_RESEARCH.md`). Divergence notable trouvée sur le SAP du colza (0,124 vs 0,133 selon la source) à trancher par Guillaume.
