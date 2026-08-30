# Audit des dépendances

- Date : 2026-08-30
- Outils : `npm audit`, `cargo audit` (RustSec advisory-db)

## npm

```
npm audit
```

**0 vulnérabilité** (137 dépendances, prod + dev + optionnelles).

## Cargo (workspace)

```
cargo audit
```

### Vulnérabilité active signalée

- **RUSTSEC-2026-0235** — `rkyv 0.7.46` : lecture hors limites possible dans des archives contenant `Rc`/`Arc`. Correctif disponible : `rkyv >= 0.8.17`.
  - **Analyse** : `rkyv` apparaît dans `Cargo.lock` uniquement comme dépendance **optionnelle** de `rust_decimal` (`rkyv = ["dep:rkyv"]` dans son `Cargo.toml`). Notre dépendance (`core/Cargo.toml`) n'active que la feature `serde-str` — la feature `rkyv` n'est jamais activée. Vérifié : `cargo update -p rkyv` ne trouve aucune version alternative satisfaisant la contrainte de `rust_decimal` (`^0.7.46`), confirmant qu'un passage à `0.8.x` nécessite une nouvelle version de `rust_decimal` elle-même, pas une action de notre côté.
  - **Conclusion** : code vulnérable présent dans le graphe de dépendances verrouillé mais **jamais compilé** dans nos binaires (pas de mise à jour majeure aveugle nécessaire ni possible actuellement). À revérifier lors de la prochaine mise à jour de `rust_decimal`.

### Avertissements « non maintenu » (pas des vulnérabilités actives)

17 avertissements portent sur les liaisons Rust de GTK3 (`atk`, `atk-sys`, `gdk`, `gdk-sys`, `gdkx11`, `gdkx11-sys`, `gtk`, `gtk-sys`, `gtk3-macros`, version 0.18.2 — famille gtk-rs signalée comme non maintenue depuis 2024), `proc-macro-error 1.0.4`, la famille `unic-*` 0.9.0, et un défaut de solidité (`unsound`) dans `glib 0.18.5` (itérateur `VariantStrIter`).

- **Analyse** : toutes ces dépendances viennent de la chaîne `tauri → wry → webkit2gtk` pour le rendu Linux ; aucune n'est déclarée directement par ce dépôt. Une mise à jour ne peut venir que d'une nouvelle version majeure de Tauri/wry migrant vers gtk-rs plus récent (hors de notre contrôle actuel, et une mise à jour majeure de Tauri en cours de développement du MVP serait précisément le type de « mise à jour majeure aveugle » à éviter).
- **Conclusion** : dépendances transitives à surveiller, pas d'action immédiate possible sans dépendre d'une nouvelle version majeure de Tauri.

## À refaire

- Relancer `npm audit` et `cargo audit` avant chaque publication, et après toute mise à jour de dépendance directe.
- Revérifier la ligne `rkyv`/`rust_decimal` si `rust_decimal` est mis à jour.
- Revérifier les avertissements gtk-rs si Tauri publie une version majeure.
