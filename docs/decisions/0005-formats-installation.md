# 0005 — Formats d'installation Windows et Ubuntu

- Date : 2026-08-30
- Statut : proposé — signature et distribution finale à confirmer par Guillaume avant publication

## Contexte

Le projet doit produire un paquet `.deb` pour Ubuntu/Debian et un installateur Windows. Tauri 2 fournit un bundler intégré capable de générer plusieurs formats sans outillage supplémentaire lourd.

## Options étudiées

- **NSIS (`.exe`)** : format par défaut du bundler Tauri pour Windows, installateur autonome léger, pas de dépendance à un service Microsoft pour la distribution.
- **MSI (WiX)** : format plus « entreprise », meilleure intégration avec les politiques de déploiement Windows, mais configuration plus lourde côté Tauri (WiX Toolset requis).
- **AppImage en complément du `.deb`** : évite l'installation système sur Linux, mais n'est pas demandé par le cadrage (`docs/PROJECT_CONTEXT.md` ne mentionne que `.deb`).

## Décision

Générer par défaut :

- **Linux** : `.deb` via le bundler Tauri (`cargo tauri build --bundles deb`).
- **Windows** : `.exe` NSIS via le bundler Tauri (`cargo tauri build --bundles nsis`).

Le format MSI reste une option ouverte, à ajouter seulement si un besoin de déploiement d'entreprise est confirmé plus tard.

## Conséquences

- La CI doit exécuter un job Linux (build + `.deb`) et un job Windows (build + `.exe` NSIS) séparés, conformément à `docs/ARCHITECTURE.md`.
- La signature de code (Windows Authenticode, notarization) et la politique de publication ne sont pas tranchées ici : elles nécessitent une décision explicite de Guillaume avant toute diffusion publique, conformément à `README.md` (licence à choisir avant diffusion) et aux règles impératives de non-publication sans accord.
