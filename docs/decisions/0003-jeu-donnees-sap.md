# 0003 — Format et provenance du jeu de données SAP

- Date : 2026-08-30
- Statut : accepté, contenu à compléter

## Contexte

`docs/PROJECT_CONTEXT.md` §5 exige que chaque corps gras conserve un identifiant stable, un indice SAP NaOH (et éventuellement KOH, jamais confondu), une source, une version/date de vérification, et un marqueur « valeur utilisateur ». `docs/SOURCES.md` propose des statuts (`documentary`, `cross_checked`, `verified`, `user_defined`) mais aucun format de fichier n'était encore choisi.

## Options étudiées

- **JSON versionné dans `data/`** : facile à valider avec un schéma TypeScript/Rust partagé (types stricts), diffable proprement, lisible.
- **TOML** : bonne lisibilité humaine, mais écosystème de validation moins pratique côté Rust pour ce besoin précis.
- **Base SQLite embarquée dès le MVP** : évite un fichier séparé mais complique le contrôle de version et la revue humaine des changements de données métier.

## Décision

Le jeu de données SAP est livré en **JSON versionné** sous `data/fats.<version>.json`, avec un schéma minimal par entrée :

```json
{
  "id": "olive",
  "displayName": "Olive",
  "aliases": ["huile d'olive"],
  "sapNaOH": "0.134",
  "sapKOH": null,
  "source": "support-atelier-miroir-de-venus",
  "sourceVersion": "2026-08-30",
  "status": "documentary",
  "verifiedAt": null,
  "crossCheckNote": "SoapCalc, Alfa Chemistry, The Soap Kitchen UK",
  "isUserDefined": false
}
```

`crossCheckNote` (optionnel) consigne les sources externes ayant corroboré ou contredit la valeur lors d'une vérification croisée (voir `docs/SOURCES.md`), affichée systématiquement dans l'éditeur (infobulle sur chaque ingrédient) et incluse dans les exports JSON — la revue de sécurité/qualité du 2026-08-30 a explicitement demandé que la provenance ne reste jamais cachée derrière un simple badge « non vérifié ».

- `sapNaOH`/`sapKOH` sont stockés en chaîne de caractères décimale (pas de flottant binaire), parsés en `Decimal` au chargement.
- `status` reprend les valeurs de `docs/SOURCES.md` (`documentary`, `cross_checked`, `verified`, `user_defined`).
- Une divergence documentée (ex. ricin `0,129` vs `0,134`) n'est jamais résolue silencieusement : elle doit apparaître dans `docs/SOURCES.md` et, si nécessaire, comme deux entrées ou une note explicite.
- Le jeu de données chargé par une recette est référencé par `dataSetVersion` sur la recette elle-même (voir modèle de données §10 de `PROJECT_CONTEXT.md`).

## Conséquences

- `core/` expose un chargeur strict qui rejette une entrée sans `sapNaOH` valide plutôt que de supposer une valeur par défaut.
- Toute mise à jour du fichier `data/fats.*.json` s'accompagne d'une entrée dans `docs/SOURCES.md` et d'un test de non-régression.
- La vérification effective des indices (passage de `documentary` à `cross_checked`/`verified`) reste un travail humain distinct, suivi dans `docs/SOURCES.md` et `TODO.md`.
