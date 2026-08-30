# La Saponnerie

Application de bureau hors ligne pour composer une recette de savon par saponification à froid et calculer les quantités de corps gras, de soude et d’eau.

## Objectif

- proposer une interface claire, moderne et accessible ;
- sélectionner les ingrédients dans une liste documentée ;
- calculer la quantité de NaOH à partir des indices SAP ;
- appliquer le surgras, la pureté de la soude et la méthode de calcul de l’eau ;
- sauvegarder et exporter les recettes ;
- produire des versions installables Ubuntu `.deb` et Windows `.exe`.

> **Sécurité :** la soude caustique est corrosive. La Saponnerie est une aide au calcul, pas une garantie de sécurité ni un substitut à une formation. Les données SAP peuvent varier selon la matière première et leur provenance doit toujours être vérifiée.

## Télécharger

Version publique actuelle : **[La Saponnerie v0.1.1](https://github.com/guillaumeboileaupro/saponerie/releases/tag/v0.1.1)**.

- [Windows — télécharger l'installateur `.exe`](https://github.com/guillaumeboileaupro/saponerie/releases/download/v0.1.1/La.Saponnerie_0.1.1_x64-setup.exe)
- [Ubuntu/Debian — télécharger le paquet `.deb`](https://github.com/guillaumeboileaupro/saponerie/releases/download/v0.1.1/La.Saponnerie_0.1.1_amd64.deb)
- [Android — télécharger le paquet `.apk`](https://github.com/guillaumeboileaupro/saponerie/releases/download/v0.1.1/La.Saponnerie_0.1.1_android.apk)

L'installateur Windows n'est pas encore signé numériquement. Windows SmartScreen peut afficher un avertissement au premier lancement, et le navigateur (Chrome/Edge) peut aussi bloquer le téléchargement en le signalant comme peu téléchargé (avertissement lié à la nouveauté du fichier, pas à un problème réel) : utiliser « Conserver quand même » dans la barre de téléchargement. Vérifier que le fichier provient bien de la page officielle de la release avant de l'exécuter. Le `.exe` a été construit par la CI sur Windows, mais doit encore être testé manuellement sur une machine Windows.

L'APK Android n'est pas distribué via le Play Store : il est signé avec une clé de release dédiée au projet, mais Android affichera un avertissement car l'application ne provient pas d'un magasin reconnu. Autoriser l'installation depuis le navigateur ou le gestionnaire de fichiers (« Installer des applications inconnues ») pour ce fichier uniquement, après avoir vérifié qu'il provient bien de la page officielle de la release. Compatible Android 7.0 (API 24) et plus, architectures ARM64 et ARM32.

## État

Le socle applicatif est fonctionnel. La pile validée est **Tauri 2 + React + TypeScript**, avec un moteur métier pur écrit en **Rust** et des calculs décimaux fondés sur `rust_decimal`.

Fonctionnalités disponibles :

- calcul NaOH multi-huiles, surgras et correction de pureté ;
- trois méthodes explicites de calcul de l’eau ;
- masse de cire d’abeille calculée automatiquement (pourcentage réglable des autres corps gras), présentée comme une sortie séparée du calcul soude/eau ;
- ingrédients documentés et ingrédients personnalisés signalés comme non vérifiés ;
- gestion séparée des additifs ;
- sauvegarde, duplication et suppression des recettes dans SQLite ;
- import et export JSON ;
- interface responsive et utilisable au clavier ;
- génération automatisée d’un paquet Ubuntu/Debian `.deb`, d’un installateur Windows NSIS `.exe` et d’un paquet Android `.apk`.

La version `v0.1.0` est publiée et téléchargeable. Elle reste une première version à évaluer : la provenance SAP doit être complétée, les avertissements de sécurité doivent recevoir une relecture humaine qualifiée, les permissions Tauri et la CSP doivent être durcies, et l'installateur Windows doit être testé manuellement. Le suivi détaillé est dans [TODO.md](TODO.md).

## Architecture

- `core/` : moteur de calcul Rust pur et tests métier ;
- `src/` : interface React et services applicatifs TypeScript ;
- `src-tauri/` : application native, commandes IPC et stockage SQLite ;
- `data/` : jeu de données SAP versionné ;
- `tests/` : parcours de bout en bout Playwright ;
- `docs/decisions/` : décisions d’architecture.

Le moteur métier ne dépend ni de React, ni de Tauri, ni du stockage. NaOH et KOH restent strictement séparés.

## Développement

Prérequis : Node.js 20, npm, Rust stable et les dépendances système de Tauri 2 pour la plateforme utilisée.

```sh
npm ci
npm run tauri dev
```

Pour lancer uniquement l’interface web :

```sh
npm run dev
```

Les fonctions natives Tauri, notamment les calculs Rust et SQLite, ne sont pas disponibles dans un navigateur ordinaire sans simulation.

## Vérifications

```sh
npm run build
npm run test:unit
npm run typecheck:e2e
npm run test:e2e
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```

Les tests Playwright nécessitent l’installation préalable de Chromium avec `npx playwright install chromium`. La CI construit et empaquette séparément Linux et Windows ; un build Windows automatisé ne remplace pas un test manuel de l’installateur sur Windows.

## Travailler avec Codex et Claude

- Codex commence par [AGENTS.md](AGENTS.md).
- Claude Code commence par [CLAUDE.md](CLAUDE.md).
- Les deux utilisent [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) comme source métier commune.
- Les décisions structurantes sont consignées dans [docs/decisions/README.md](docs/decisions/README.md).

## Documentation

- [Contexte fonctionnel et métier](docs/PROJECT_CONTEXT.md)
- [Architecture proposée](docs/ARCHITECTURE.md)
- [Sources et provenance](docs/SOURCES.md)
- [Installation et désinstallation](docs/INSTALLATION.md)
- [Plan de travail](TODO.md)
- [Règles de contribution](CONTRIBUTING.md)

## Skills du projet

Les workflows spécialisés sont destinés à être installés dans :

- `.agents/skills/` pour Codex ;
- `.claude/skills/` pour Claude Code.

Ils ne doivent pas dupliquer les formules ni les règles métier : celles-ci restent centralisées dans `docs/PROJECT_CONTEXT.md`.

## Licence

GNU General Public License v3.0 ou ultérieure (GPL-3.0-or-later) — voir [LICENSE](LICENSE).
