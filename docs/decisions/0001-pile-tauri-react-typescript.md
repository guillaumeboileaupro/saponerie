# 0001 — Pile Tauri 2 + React + TypeScript

- Date : 2026-08-30
- Statut : accepté

## Contexte

`docs/ARCHITECTURE.md` proposait Tauri 2 pour l'application de bureau et l'empaquetage, React + TypeScript strict pour l'interface. Le projet cible Windows (`.exe`) et Ubuntu/Debian (`.deb`), doit fonctionner hors ligne et sans télémétrie.

## Options étudiées

- **Tauri 2 + React + TypeScript** : empaquetage natif léger, WebView système, écosystème React déjà connu, bon support des paquets `.deb` et des installateurs Windows via le bundler Tauri.
- **Electron + React** : écosystème mature mais empreinte mémoire/disque nettement plus lourde, moins aligné avec l'exigence de sobriété.
- **Application native pure (ex. Qt, GTK)** : performances et intégration système supérieures, mais coût de développement et de maintenance UI plus élevé, moins adapté à une itération rapide sur l'interface.

## Décision

Confirmer Tauri 2 + React + TypeScript strict. Aucune alternative n'apporte un avantage suffisant pour justifier l'écart avec la proposition initiale de `docs/ARCHITECTURE.md`.

## Conséquences

- L'UI vit dans `src/` (React + TypeScript), l'application native dans `src-tauri/`.
- Le moteur de calcul pur reste indépendant de Tauri et de React (voir [0002](0002-langage-moteur-decimal.md)).
- La CI doit couvrir un build Linux et un build Windows séparément.
