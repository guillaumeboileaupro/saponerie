# Recherche exploratoire — profils d'acides gras

- Date : 2026-08-30
- Statut : **recherche documentaire brute, non intégrée au produit**

## Pourquoi ce document existe

`docs/PROJECT_CONTEXT.md` §5.2 autorise les profils d'acides gras et indicateurs de propriétés (dureté, mousse, douceur…) « seulement avec des sources fiables », jamais présentés comme des résultats certains. Une recherche a été menée pour évaluer si des données suffisamment solides existaient pour les intégrer à l'application. **Conclusion : pas encore.** Ce document conserve la recherche pour ne pas la refaire, sans en faire une source de vérité produit.

## Ce qui bloque une intégration immédiate

- Les calculateurs de référence du milieu (SoapCalc, From Nature With Love, Summer Bee Meadow, Soapmaking Friend) chargent leurs données par JavaScript interactif : impossible de les extraire par une recherche automatisée. Les indicateurs numériques (hardness, cleansing, conditioning, bubbly, creamy) manquent ou sont incomplets pour plusieurs huiles (bourrache, maïs, onagre, soja, cire d'abeille).
- Pour plusieurs huiles, les sources scientifiques donnent des **fourchettes larges et non tranchées** plutôt qu'une valeur unique : lin (ALA 39–60 % selon cultivar), onagre (linoléique 60–85 %), karité (oléique 34–62 %, stéarique 20–55,7 % — forte variabilité géographique documentée par les sources elles-mêmes), bourrache (GLA 17–25 %).
- Le tableau Go Native NZ, utilisé comme source croisée pour plusieurs huiles, ne couvre pas les acides laurique/myristique — pourtant dominants dans l'huile de coco — rendant son profil incomplet pour cet ingrédient.

## Point nécessitant une attention humaine avant toute autre décision

Une base tierce (Soaply) donne pour le **colza** un SAP NaOH de **0,133**, alors que le jeu de données courant (`data/fats.2026-08-30.json`, provenance `support-atelier-miroir-de-venus`) retient **0,124** — écart d'environ 7 %, le plus important relevé sur l'ensemble du jeu de données à ce jour. La vérification croisée précédente (2026-08-30, voir `docs/SOURCES.md`) avait pourtant trouvé 0,124 concordant via Alfa Chemistry, The Soap Kitchen et un calcul indépendant depuis le SAP KOH. Il s'agit donc d'un désaccord entre sources tierces, pas d'une erreur de transcription évidente. **Ce point doit être tranché par Guillaume avant de considérer le colza comme `cross_checked` de façon définitive.**

Divergences mineures supplémentaires notées par la même source (Soaply) : saindoux 0,141 vs 0,138 (projet), coco 0,184 vs 0,183 (projet, écart négligeable). Ricin (0,129) et karité (0,128) concordent exactement.

## Ce qui pourrait être ajouté sans risque, si souhaité

Les notes qualitatives déjà présentes en `docs/PROJECT_CONTEXT.md` §5.2 (ex. « cacao : savon très dur, peu de mousse » ; « ricin : mousse stable et crémeuse ») sont cohérentes avec cette recherche et ne nécessitent pas de nouvelle source. Elles restent documentaires et ne doivent pas être présentées comme des résultats certifiés, conformément au texte déjà en place.

## Décision prise pour cette itération

Aucune donnée chiffrée de cette recherche n'a été intégrée à `data/`. Aucune fonctionnalité « profils d'acides gras » n'a été construite dans l'application : l'écart de fiabilité entre huiles (certaines bien sourcées, d'autres non) rendrait la fonctionnalité trompeuse en l'état. À reconsidérer si une source unique, cohérente et complète (idéalement SoapCalc consulté manuellement dans un navigateur) devient disponible.
