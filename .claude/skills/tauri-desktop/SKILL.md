---
name: tauri-desktop
description: Développer et empaqueter La Saponnerie comme application Tauri 2 avec React et TypeScript, pour Ubuntu .deb et Windows .exe.
---

# Tauri desktop

Utiliser Tauri 2, React et TypeScript. Garder le moteur de calcul testable indépendamment de Tauri et éviter les permissions natives inutiles.

## Architecture

- frontend : composants, formulaires et présentation ;
- domaine : calculs purs, types stricts et validation ;
- adaptateurs : stockage local et commandes Tauri ;
- src-tauri : configuration, capacités et fonctions natives minimales.

## Développement

- vérifier les prérequis Node, Rust et Tauri avant de générer le projet ;
- verrouiller les versions avec les fichiers lock ;
- typer les échanges entre React et Rust ;
- limiter les commandes IPC et valider toutes leurs entrées ;
- conserver les recettes localement sans service distant tant que ce n’est pas nécessaire.

## Packaging

- Linux : produire et tester le paquet Debian sur une version Ubuntu prise en charge ;
- Windows : produire un installateur NSIS ou MSI depuis un runner Windows ;
- ne jamais prétendre qu’un artefact Windows a été testé depuis Linux ;
- valider installation, lancement, désinstallation, icône, version et métadonnées ;
- automatiser les deux builds avec une matrice GitHub Actions.

Avant une release, exécuter tests unitaires, tests UI, audit des capacités Tauri et installation réelle des artefacts.