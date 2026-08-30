# Installation et désinstallation

Ce document décrit l'installation des paquets produits par la CI (voir `.github/workflows/ci.yml` et [ADR 0005](decisions/0005-formats-installation.md)). Aucune connexion réseau n'est nécessaire après l'installation : l'application et ses calculs fonctionnent entièrement hors ligne.

## Ubuntu / Debian (`.deb`)

### Installation

```sh
sudo dpkg -i "La Saponnerie_<version>_amd64.deb"
```

Si `dpkg` signale des dépendances manquantes (rare, `libwebkit2gtk-4.1-0` et `libgtk-3-0` sont déclarées dans le paquet) :

```sh
sudo apt-get install -f
```

L'application apparaît ensuite dans le menu des applications sous le nom « La Saponnerie » et peut aussi être lancée depuis un terminal :

```sh
la-saponnerie
```

### Désinstallation

```sh
sudo apt-get remove la-saponnerie      # conserve la configuration
sudo apt-get purge la-saponnerie       # supprime aussi la configuration
```

Les recettes enregistrées localement (base SQLite, voir [ADR 0004](decisions/0004-stockage-local-migrations.md)) vivent dans le dossier de données de l'utilisateur (`~/.local/share/com.lasaponnerie.app/` par défaut) et ne sont pas supprimées par ces commandes ; les effacer manuellement si besoin.

## Windows (installateur NSIS, `.exe`)

### Installation

1. Lancer l'installateur `La Saponnerie_<version>_x64-setup.exe`.
2. Suivre l'assistant (aucune option avancée requise pour un usage standard).
3. L'application est ajoutée au menu Démarrer.

L'installateur n'est pas signé numériquement pour l'instant (voir [ADR 0005](decisions/0005-formats-installation.md), section signature) : Windows SmartScreen peut afficher un avertissement à la première exécution. C'est attendu tant qu'aucun certificat de signature n'a été mis en place.

### Désinstallation

Via **Paramètres → Applications → Applications installées**, rechercher « La Saponnerie » puis choisir Désinstaller. Les recettes enregistrées localement vivent dans `%APPDATA%\com.lasaponnerie.app\` et ne sont pas supprimées automatiquement.

## Vérifications effectuées

- **Linux** : build (`cargo tauri build --bundles deb`), installation (`dpkg -i`), lancement réel de l'application installée, désinstallation (`dpkg --purge`) — testés directement sur cette machine.
- **Windows** : build et empaquetage automatisés par la CI GitHub Actions sur un runner Windows réel. **Non testé manuellement sur une machine Windows** — à faire avant toute diffusion, conformément à la règle du skill `tauri-desktop` : ne jamais prétendre qu'un artefact Windows a été validé depuis Linux.
