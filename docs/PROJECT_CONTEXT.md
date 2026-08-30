# Contexte projet — La Saponnerie

> Document de cadrage commun pour Claude Code et Codex. À lire entièrement avant toute proposition, planification ou modification du projet.

## 1. Vision

**La Saponnerie** est une application de bureau simple et agréable permettant de préparer une recette de savon par saponification à froid.

L’utilisateur choisit des huiles et des beurres dans une liste, saisit leur masse, choisit le surgras et le mode de calcul de l’eau. L’application calcule ensuite :

- la masse totale des corps gras ;
- la quantité théorique d’hydroxyde de sodium (NaOH) à pureté 100 % ;
- la quantité réelle de NaOH après correction du surgras et de la pureté du produit ;
- la quantité d’eau ;
- la masse totale estimée de la préparation ;
- la proportion de chaque corps gras dans la recette.

Le logiciel doit fonctionner hors ligne et être distribuable sous forme de paquet **`.deb` pour Ubuntu/Debian** et d’installateur **`.exe` pour Windows**.

## 2. État actuel et règle de démarrage

Le projet est au stade du cadrage. Les documents photographiés fournis par Guillaume contiennent des recettes, des indices manuscrits et des consignes de sécurité. Ils servent à comprendre le besoin et à constituer des tests de non-régression, mais **ne constituent pas à eux seuls une source chimique de référence**.

Avant de générer l’architecture définitive ou le code de production :

1. lire ce document ;
2. inventorier les skills et règles ajoutés au dépôt ;
3. proposer un plan court et attendre la validation de Guillaume pour tout choix structurant ;
4. ne jamais commit, push, merge, publier une release ou modifier un dépôt distant sans demande explicite ;
5. préserver les changements existants et ne pas réécrire inutilement les fichiers.

## 3. Utilisateur cible et parcours principal

L’utilisateur n’est pas supposé connaître les formules chimiques.

Parcours principal :

1. Créer une nouvelle recette.
2. Ajouter un corps gras depuis une liste recherchable.
3. Indiquer sa quantité en grammes.
4. Répéter l’opération pour les autres huiles ou beurres.
5. Choisir le taux de surgras, avec une valeur initiale explicite et modifiable.
6. Indiquer la pureté de la soude utilisée.
7. Choisir la méthode de calcul de l’eau.
8. Lire immédiatement les résultats et les avertissements.
9. Enregistrer, dupliquer, imprimer ou exporter la recette.

Le calcul doit être réactif, mais les résultats ne doivent être présentés comme utilisables qu’après validation de tous les champs.

## 4. Formules métier

Toutes les masses sont exprimées en grammes. Chaque corps gras possède un indice `sapNaOH`, exprimé en grammes de NaOH nécessaires par gramme de corps gras.

### 4.1 Soude théorique

Pour chaque corps gras `i` :

```text
NaOH_i = masse_i × sapNaOH_i
```

Puis :

```text
NaOH_théorique = somme(NaOH_i)
```

### 4.2 Surgras par réduction de soude

Pour un surgras `s` exprimé en pourcentage :

```text
NaOH_après_surgras = NaOH_théorique × (1 − s / 100)
```

Le terme « surgras » doit être clairement distingué d’un éventuel ajout d’huile à la trace, qui n’est pas équivalent dans le calcul.

### 4.3 Pureté de la soude

Pour une pureté `p` exprimée en pourcentage :

```text
NaOH_à_peser = NaOH_après_surgras / (p / 100)
```

La pureté ne doit jamais être supposée silencieusement. Une valeur par défaut éventuelle doit être visible dans l’interface.

### 4.4 Eau

L’application doit prendre en charge trois modes sans les mélanger :

**Concentration de la solution de soude** `c` :

```text
eau = NaOH_à_peser × (1 − c) / c
```

où `c` est compris strictement entre 0 et 1.

**Ratio eau/soude** `r` :

```text
eau = NaOH_à_peser × r
```

**Pourcentage des corps gras** `w` — mode utilisé dans plusieurs notes fournies :

```text
eau = masse_totale_corps_gras × w / 100
```

L’écran doit toujours afficher la méthode active et ses paramètres. Ne jamais convertir ou remplacer une méthode sans prévenir l’utilisateur.

### 4.5 Arrondis

- Conserver une précision décimale suffisante pendant tous les calculs.
- Arrondir uniquement pour l’affichage final.
- Afficher par défaut les masses au dixième de gramme, avec une option adaptée à la précision de la balance.
- Ne jamais effectuer les calculs métier à partir de valeurs déjà arrondies.

### 4.6 Bornes de validation (proposition à confirmer)

Ces bornes sont une proposition initiale, alignée sur les pratiques usuelles de la saponification à froid (calculateurs de savon de référence). Elles doivent être confirmées par Guillaume avant d'être considérées comme définitives ; voir [ADR 0002](decisions/0002-langage-moteur-decimal.md) pour le moteur qui les applique.

| Paramètre | Borne stricte (refus) | Plage usuelle (avertissement hors plage) |
| --- | --- | --- |
| Masse d'un corps gras | `> 0`, obligatoire | — |
| Surgras `s` | `0 % ≤ s ≤ 30 %` | recommandé `0–15 %` |
| Pureté de la soude `p` | `0 % < p ≤ 100 %` | recommandé `90–100 %` |
| Concentration de solution `c` | `0 < c < 1` (contrainte mathématique de la formule) | recommandé `0,25–0,40` |
| Ratio eau/soude `r` | `r > 0` | recommandé `1–3` |
| Pourcentage des corps gras `w` | `0 % < w ≤ 100 %` | recommandé `30–40 %` |

- Une valeur en dehors de la borne stricte est refusée (aucun résultat exploitable affiché).
- Une valeur en dehors de la plage usuelle mais dans la borne stricte est acceptée mais accompagnée d'un avertissement visible (recette non conventionnelle, à vérifier par l'utilisateur).
- Ces plages ne remplacent pas un jugement professionnel ; elles évitent seulement les erreurs de saisie grossières.

## 5. Données des corps gras

La première liste fonctionnelle devra au minimum prévoir les ingrédients visibles dans les documents :

- huile d’olive ;
- huile de coco/noix de coco ;
- huile de tournesol ;
- huile de colza ;
- huile de karité/beurre de karité ;
- beurre de cacao ;
- huile de ricin ;
- huile d’argan ;
- cire d’abeille, avec traitement explicite si sa méthode de calcul diffère ;
- autres ingrédients uniquement après vérification des données.

### Cas particulier : cire d'abeille

Contrairement aux autres corps gras, la masse de cire d'abeille n'est jamais saisie directement par l'utilisateur. Elle est calculée automatiquement comme un pourcentage de la masse des **autres** corps gras de la recette (par défaut 4 %), jamais comme un pourcentage de la soude. L'application affiche ce pourcentage (modifiable) et la masse résultante en lecture seule ; elle recalcule cette masse à chaque changement des autres ingrédients.

Chaque entrée doit comporter :

- un identifiant stable ;
- le nom français et les alias utiles ;
- l’indice SAP NaOH ;
- éventuellement l’indice SAP KOH, stocké séparément et jamais confondu avec le NaOH ;
- la source de la valeur ;
- la date ou version de vérification ;
- une indication « valeur utilisateur » pour les ingrédients personnalisés.

Les valeurs manuscrites observées dans les photos ne doivent pas être recopiées directement dans la base de production. Toute valeur doit être croisée avec une source sérieuse et couverte par des tests. Un utilisateur avancé peut créer un ingrédient personnalisé, mais l’application doit alors signaler clairement que la valeur n’est pas vérifiée.

### 5.1 Table SAP NaOH transcrite du support fourni

Le support imprimé « Le Miroir de Vénus — Cosmétique bio et naturelle » contient la table suivante. Elle doit être conservée comme **jeu de données documentaire à vérifier**, avec la provenance `support-atelier-miroir-de-venus`, et non comme vérité chimique universelle. Les indices SAP pouvant varier selon la matière première et la source, la version finale devra indiquer la provenance et permettre une mise à jour contrôlée.

| Corps gras | SAP NaOH fourni (g/g) |
| --- | ---: |
| Amande douce | 0,136 |
| Bourrache | 0,136 |
| Carthame | 0,136 |
| Chanvre | 0,135 |
| Cire d’abeille | 0,069 |
| Colza | 0,124 |
| Germe de blé | 0,131 |
| Lin | 0,136 |
| Maïs | 0,136 |
| Noisette | 0,136 |
| Noyau d’abricot | 0,135 |
| Olive | 0,134 |
| Onagre | 0,136 |
| Pépin de raisin | 0,127 |
| Ricin | 0,129 |
| Soja | 0,135 |
| Tournesol | 0,134 |
| Saindoux | 0,138 |
| Huile de coco | 0,183 |
| Beurre de cacao | 0,137 |
| Beurre de karité | 0,128 |

Les photos manuscrites utilisent parfois une valeur différente, par exemple `0,124` pour le ricin alors que la table imprimée indique `0,129`. Ce type d’écart doit être détecté, documenté et résolu avant d’en faire un test normatif.

### 5.2 Propriétés indicatives et recommandations

Les documents comportent aussi des descriptions qualitatives : dureté, mousse, douceur, vitesse de trace, stabilité et oxydabilité. Elles peuvent alimenter une future aide à la formulation, mais ne doivent pas être présentées comme des résultats certains ou médicaux.

Exemples à conserver comme notes documentaires :

- cacao : savon très dur, peu de mousse, agent durcissant ;
- karité : savon doux et dur, mousse fine, trace rapide ;
- cire d’abeille : durcit et accélère fortement la trace ;
- coco : savon dur et mousse abondante, potentiellement desséchant à forte proportion ;
- colza : savon doux, mousse fine, trace lente ;
- olive : savon doux, mousse fine, trace lente ;
- ricin : favorise une mousse stable et crémeuse ;
- jojoba : cire liquide très stable, recommandation documentaire d’utilisation limitée ;
- huiles fragiles ou très oxydables : afficher éventuellement une information de stabilité, sans inventer de date de conservation.

Les informations relatives aux allergies, à la peau, aux cheveux et aux huiles essentielles nécessitent des sources spécifiques et une rédaction prudente. Elles restent hors du moteur de calcul du MVP.

## 6. Sécurité obligatoire

La soude caustique est corrosive. Le logiciel est une aide au calcul, pas une garantie de sécurité ni un substitut à une formation.

L’application doit :

- afficher un avertissement de sécurité lors de la première utilisation et dans chaque fiche recette ;
- rappeler les équipements de protection : lunettes adaptées, gants résistants, manches longues et espace ventilé ;
- rappeler de tenir enfants et animaux éloignés ;
- rappeler de **verser progressivement la soude dans l’eau, jamais l’eau sur la soude** ;
- signaler que la dissolution chauffe fortement et dégage des vapeurs irritantes ;
- déconseiller les récipients incompatibles, notamment l’aluminium ;
- ne pas valider une recette comportant une masse négative ou nulle, un indice absent, une pureté invalide ou un paramètre d’eau incohérent ;
- afficher les hypothèses de calcul dans le récapitulatif imprimable ;
- demander une confirmation explicite avant d’afficher une fiche de fabrication finale.

Le support photographié propose un « test de la langue » pour rechercher une sensation caustique. **Cette pratique ne doit jamais être conseillée, reproduite ni intégrée dans La Saponnerie.** Aucun test impliquant de goûter, lécher ou mettre en bouche un savon ou une préparation ne doit apparaître. Les problèmes de formulation doivent être traités par le recalcul, la vérification des pesées et des méthodes de contrôle sûres et documentées.

Le texte de sécurité et les bornes métier devront être vérifiés avant publication. Une simple case « j’accepte » ne remplace pas les contrôles de cohérence.

## 7. Interface souhaitée

Direction visuelle : moderne, chaleureuse, artisanale et sobre. Éviter les dégradés, l’apparence générique « générée par IA », les ornements excessifs et les interfaces trop techniques.

Principes :

- interface en français au lancement ;
- mise en page claire en deux zones : recette à gauche, résultats à droite sur grand écran ;
- adaptation correcte aux petits écrans ;
- palette naturelle et contrastée, avec une couleur principale cohérente ;
- cartes simples, coins légèrement arrondis, espaces généreux ;
- tableau des ingrédients éditable au clavier ;
- recherche rapide, ajout et suppression évidents ;
- total des huiles, soude et eau toujours visibles ;
- mise à jour immédiate avec messages d’erreur proches des champs ;
- mode clair et sombre si cela ne complexifie pas le premier jalon ;
- accessibilité clavier, contraste WCAG AA, libellés explicites et tailles lisibles.

Écrans du MVP :

1. Accueil / recettes récentes.
2. Éditeur de recette.
3. Sélection d’un corps gras.
4. Résultats et contrôles.
5. Fiche de sécurité.
6. Paramètres : unité, précision, méthode d’eau par défaut et pureté habituelle.

## 8. Fonctionnalités

### MVP

- calcul multi-huiles NaOH ;
- surgras par réduction de soude ;
- correction de pureté ;
- trois méthodes explicites de calcul de l’eau ;
- ajout, modification, réorganisation et suppression d’ingrédients ;
- sauvegarde locale des recettes ;
- duplication d’une recette ;
- validation et avertissements de sécurité ;
- export PDF ou impression d’une fiche lisible ;
- fonctionnement entièrement hors ligne ;
- paquets `.deb` et `.exe` reproductibles.

### Après le MVP

- import/export JSON ;
- ingrédients personnalisés ;
- historique des versions d’une recette ;
- changement d’échelle d’une recette ;
- additifs séparés des corps gras : argiles, poudres, exfoliants, fragrances et huiles essentielles ;
- gestion explicite des liquides qui remplacent une partie de l’eau, sans double comptage ;
- estimation du poids avant/après cure clairement présentée comme estimation ;
- profils d’acides gras et indicateurs de propriétés, seulement avec sources fiables ;
- prise en charge de KOH/savon liquide dans un module séparé afin d’éviter toute confusion ;
- traductions.

### Hors périmètre initial

- vente en ligne ;
- compte cloud obligatoire ;
- réseau social ;
- pilotage de matériel ;
- recommandations médicales ou dermatologiques ;
- promesse de conformité réglementaire automatique.

## 9. Architecture technique recommandée

Choix proposé, à confirmer après l’ajout des skills :

- **Tauri 2** pour l’application de bureau et les paquets Windows/Linux ;
- **React + TypeScript** pour l’interface ;
- logique de calcul isolée dans un module pur, idéalement en Rust si cela simplifie la fiabilité et le partage avec le cœur Tauri ;
- nombres décimaux explicites pour les calculs, sans dépendre naïvement des flottants binaires ;
- stockage local versionné, par exemple SQLite ;
- données SAP livrées comme jeu de données versionné avec provenance ;
- aucune télémétrie par défaut ;
- aucune connexion réseau nécessaire au calcul.

Le moteur de calcul ne doit dépendre ni de l’interface ni du stockage. Les données d’entrée et de sortie doivent avoir des types stricts. Tout changement d’une formule exige un test correspondant et une note de version.

Structure indicative :

```text
src/                 interface React
src/components/      composants visuels
src/features/recipe/ éditeur et état de recette
src-tauri/            application Tauri
core/                calculs purs et validations
data/                indices SAP sourcés et versionnés
tests/               tests unitaires, intégration et cas de référence
docs/                décisions, sécurité et provenance
packaging/           configuration .deb et Windows
```

Ne pas créer cette structure mécaniquement si les skills ou le dépôt existant imposent une autre convention.

## 10. Modèle de données minimal

```text
Fat
- id
- displayName
- aliases[]
- sapNaOH
- sapKOH? 
- source
- sourceVersion
- verifiedAt
- isUserDefined

RecipeIngredient
- id
- fatId
- massGrams
- order

Recipe
- id
- name
- ingredients[]
- superfatPercent
- lyePurityPercent
- waterMode: concentration | waterLyeRatio | percentOfOils
- waterParameter
- createdAt
- updatedAt
- dataSetVersion

CalculationResult
- totalFatGrams
- theoreticalNaOHGrams
- discountedNaOHGrams
- weighedNaOHGrams
- waterGrams
- totalBatchGrams
- ingredientBreakdown[]
- assumptions[]
- warnings[]
```

## 11. Tests et critères d’acceptation

Le cœur de calcul doit être testé indépendamment de l’interface.

Tests indispensables :

- un seul corps gras avec résultat calculé à la main ;
- plusieurs corps gras ;
- surgras à 0 %, 5 % et une valeur personnalisée autorisée ;
- pureté à 100 % et pureté inférieure ;
- chacune des trois méthodes d’eau ;
- ordre des ingrédients sans effet sur le résultat ;
- recette redimensionnée avec conservation des proportions ;
- champs vides, zéro, négatifs, valeurs non numériques et valeurs hors bornes ;
- absence ou confusion SAP KOH/NaOH ;
- stabilité des arrondis ;
- migration d’une ancienne version des données locales ;
- reproduction des recettes photographiées lorsque leurs entrées ont été confirmées.

### 11.1 Cas de référence issus des documents

Ces cas permettent de vérifier que le logiciel sait reproduire la méthode du support. Ils ne valident pas à eux seuls les indices SAP.

**Cas A — savon de base du support**

| Ingrédient | Masse | SAP NaOH | Soude théorique |
| --- | ---: | ---: | ---: |
| Tournesol | 200 g | 0,134 | 26,80 g |
| Olive | 320 g | 0,134 | 42,88 g |
| Coco | 200 g | 0,183 | 36,60 g |
| Cire d’abeille | 30 g | 0,069 | 2,07 g |

- corps gras : `750 g` ;
- NaOH théorique : `108,35 g` ;
- surgras 5 % : `102,9325 g`, affiché `102,93 g` ;
- eau à 35 % des corps gras : `262,50 g`.

**Cas B — shampoing solide du support**

| Ingrédient | Masse | SAP NaOH | Soude théorique |
| --- | ---: | ---: | ---: |
| Beurre de cacao | 130 g | 0,137 | 17,81 g |
| Beurre de karité | 100 g | 0,128 | 12,80 g |
| Coco | 100 g | 0,183 | 18,30 g |
| Ricin | 50 g | 0,134 dans la fiche recette | 6,70 g |

- corps gras : `380 g` ;
- NaOH théorique indiqué : `55,61 g` ;
- surgras 5 % indiqué : `52,8295 g` ;
- eau à 35 % : `133 g`.

Ce cas contient une incohérence documentaire : la fiche utilise `0,134` pour le ricin alors que la table SAP imprimée donne `0,129`. Le logiciel doit utiliser la valeur du jeu de données sélectionné et afficher sa source ; le test de reproduction historique peut fixer explicitement `0,134` comme valeur de la fiche.

**Cas C — recette manuscrite 1**

- coco `100 g × 0,183 = 18,30 g` ;
- colza `100 g × 0,124 = 12,40 g` ;
- cacao `30 g × 0,137 = 4,11 g` ;
- tournesol `100 g × 0,134 = 13,40 g` ;
- cire d’abeille `13,2 g × 0,069 ≈ 0,91 g` ;
- total théorique : `49,11 g` ;
- après réduction de 5 % : environ `46,65 g` ;
- eau manuscrite : `120 g`.

La masse totale des corps gras est `343,2 g`; `35 %` donnerait `120,12 g`, ce qui explique l’eau arrondie à `120 g`.

**Cas D — recette manuscrite 2**

- colza `84 g × 0,124 = 10,416 g` ;
- coco `100 g × 0,183 = 18,30 g` ;
- cacao `50 g × 0,137 = 6,85 g` ;
- karité `50 g × 0,128 = 6,40 g` ;
- cire d’abeille `11,4 g × 0,069 ≈ 0,787 g` ;
- total théorique : environ `42,75 g` ;
- après réduction de 5 % : environ `40,61 g` ;
- eau : environ `103,39 g`, soit `35 %` de `295,4 g`.

Pour chaque cas, les tests doivent comparer les valeurs non arrondies avec une tolérance décimale définie et vérifier séparément l’affichage arrondi.

Critères du MVP :

- mêmes entrées + même version des données = mêmes résultats sur Windows et Ubuntu ;
- aucun résultat exploitable si une donnée critique est invalide ;
- les hypothèses, le surgras, la pureté et la méthode d’eau sont visibles ;
- sauvegarde et réouverture sans perte ;
- installation et désinstallation propres via `.deb` et `.exe` ;
- tests automatiques du moteur et de l’interface critique ;
- aucune requête réseau nécessaire.

## 12. Qualité et méthode de travail pour les agents

- Commencer par inspecter le dépôt, ses règles et son état Git.
- Expliquer les choix structurants avant de les appliquer.
- Produire de petits changements vérifiables.
- Utiliser des types stricts ; éviter `any` et les conversions implicites.
- Séparer données, calcul, validation, affichage et persistance.
- Ne jamais inventer un indice SAP ou masquer une hypothèse.
- Ajouter ou mettre à jour les tests avec chaque changement de calcul.
- Ne pas modifier le style validé sans demande.
- Ne pas ajouter de dépendance lourde sans justification.
- Ne pas effectuer de commit, push, merge ou release sans ordre explicite de Guillaume.
- Signaler honnêtement ce qui reste non vérifié.

## 13. Questions à trancher après installation des skills

1. Confirmer Tauri 2 + React + TypeScript, ou retenir une autre pile explicitement justifiée.
2. Choisir le format exact de l’installateur Windows produit en plus ou à la place du `.exe` autonome.
3. Déterminer les sources faisant autorité pour les indices SAP.
4. Fixer les bornes autorisées pour le surgras, la pureté et la concentration de soude.
5. Choisir la méthode d’eau proposée par défaut sans cacher les autres.
6. Déterminer si les recettes restent uniquement locales au MVP.
7. Valider le logo, la palette et les maquettes avant implémentation détaillée.
8. Confirmer le niveau de précision attendu selon la balance utilisée.

## 14. Définition courte à réutiliser

> La Saponnerie est un calculateur de recettes de savon hors ligne pour Windows et Ubuntu. L’utilisateur sélectionne ses huiles et beurres, indique les quantités, le surgras, la pureté de la soude et la méthode de calcul de l’eau. L’application calcule de façon transparente la masse de NaOH et d’eau, explique ses hypothèses, contrôle les entrées et présente les avertissements indispensables liés à la manipulation de la soude caustique.
