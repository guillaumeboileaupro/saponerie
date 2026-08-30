# Sources et provenance

## Principe

Aucune valeur SAP ou affirmation de sécurité ne doit entrer dans le produit sans provenance identifiable, date de vérification et test associé.

## Documents fournis

Les photographies du support « Le Miroir de Vénus — Cosmétique bio et naturelle » ont servi à établir le besoin, transcrire une table SAP documentaire et créer des cas de référence.

Ces documents sont une source de cadrage et non une autorité chimique universelle. Les divergences doivent être conservées et résolues explicitement.

### Divergences connues

Le ricin fait l'objet de **deux** divergences documentaires distinctes, à ne pas confondre :

- `0,124` — mentionné en §5.1 de `PROJECT_CONTEXT.md` comme exemple générique d'écart observé sur des photos manuscrites, sans fiche précise associée.
- `0,134` — valeur effectivement utilisée dans la fiche « shampoing solide » (Cas B, §11.1 de `PROJECT_CONTEXT.md`).
- `0,129` — valeur de la table imprimée du support, reprise dans `data/fats.2026-08-30.json`.

Le jeu de données doit indiquer la valeur active (`0,129`) et sa source. Les tests de reproduction historique (Cas B) peuvent fixer explicitement `0,134` pour ce cas précis, sans jamais rendre cette valeur globale ni écraser `0,129` dans le jeu de données courant.

## Statuts proposés

- `documentary` : transcrit d’un document fourni ;
- `cross_checked` : confirmé par plusieurs sources fiables ;
- `verified` : accepté pour la version publiée ;
- `user_defined` : saisi par l’utilisateur et non vérifié.

## Vérification croisée du 2026-08-30

Recherche menée par un agent, sources consultées le 30/08/2026 : SoapCalc (soapcalc.net/oil-list), From Nature With Love (fromnaturewithlove.com/resources/sapon.asp), Soaper's Choice (soaperschoice.com/pages/sap-values), Alfa Chemistry — reference guide cosmétique, The Soap Kitchen UK (thesoapkitchen.co.uk/guide-to-sap-values), tolérance ±0,003 g/g. Détail complet conservé hors dépôt (rapport de session) ; résumé ci-dessous.

| Corps gras | Valeur support | Statut proposé | Note |
| --- | ---: | --- | --- |
| Amande douce | 0,136 | `cross_checked` | concordant (4/5 sources) |
| Bourrache | 0,136 | `cross_checked` | concordant |
| Carthame | 0,136 | `cross_checked` | concordant |
| Chanvre | 0,135 | `cross_checked` | écart mineur (±0,003) selon la source |
| Cire d'abeille | 0,069 | `cross_checked` | concordant |
| Colza | 0,124 | `cross_checked` | concordant ; **ne pas confondre avec le canola** (~0,132–0,133), botaniquement proche mais chimiquement distinct |
| Germe de blé | 0,131 | `cross_checked` | concordant |
| Lin | 0,136 | `cross_checked` | concordant |
| Maïs | 0,136 | `cross_checked` | concordant |
| Noisette | 0,136 | `cross_checked` | concordant |
| Noyau d'abricot | 0,135 | `cross_checked` | concordant |
| Olive | 0,134 | `cross_checked` | concordant |
| Onagre | 0,136 | `cross_checked` | concordant |
| Pépin de raisin | 0,127 | `documentary` | **sources externes elles-mêmes dispersées (0,1265–0,135) : à revérifier avant `cross_checked`** |
| Ricin | 0,129 | `cross_checked` | fortement corroboré (5 sources indépendantes) |
| Soja | 0,135 | `cross_checked` | concordant |
| Tournesol | 0,134 | `cross_checked` | concordant |
| Saindoux | 0,138 | `cross_checked` | écart mineur (±0,003) selon la source |
| Huile de coco | 0,183 | `documentary` | concordant avec SoapCalc, mais **variabilité forte selon le type** (76°, 92°, raffinée : 0,178–0,190) — préciser le type avant `cross_checked` |
| Beurre de cacao | 0,137 | `cross_checked` | concordant |
| Beurre de karité | 0,128 | `cross_checked` | concordant (fort consensus) |

Points restant à trancher par Guillaume avant de figer `data/fats.2026-08-30.json` en `verified` :

1. Confirmer si la photo manuscrite d'origine porte bien `0,124` (§5.1) — indépendamment de la fiche shampoing à `0,134`.
2. Pépin de raisin : chercher une source supplémentaire faisant autorité avant de passer en `cross_checked`.
3. Huile de coco : préciser le type (point de fusion 76°/92°, raffinée ou non) correspondant à `0,183` dans le support, pour éviter une confusion si plusieurs variantes de coco sont ajoutées.

## À faire

- trancher les trois points ci-dessus avec Guillaume ;
- consigner précisément titre, auteur, édition, URL et date d'accès pour chaque source retenue dans `data/fats.2026-08-30.json` ;
- faire relire les avertissements de sécurité avant publication.
