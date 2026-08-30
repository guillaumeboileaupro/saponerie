---
name: playwright
description: Vérifier l’interface et les parcours utilisateur de La Saponnerie avec Playwright, captures et traces. Utiliser pour les tests UI et les régressions visuelles.
---

# Tests Playwright

Tester les parcours qui engagent le calcul, pas seulement le rendu des composants.

## Parcours prioritaires

1. Démarrer avec une recette vide.
2. Ajouter, modifier puis supprimer plusieurs corps gras.
3. Changer NaOH/KOH et vérifier que les résultats changent.
4. Modifier surgraissage et méthode de calcul de l’eau.
5. Vérifier les erreurs de saisie et données SAP absentes.
6. Sauvegarder, rouvrir et supprimer une recette.
7. Naviguer entièrement au clavier.

## Méthode

- utiliser des rôles et libellés accessibles plutôt que des sélecteurs CSS fragiles ;
- figer les données métier utilisées par le test ;
- comparer les nombres avec une tolérance explicitée ;
- capturer une trace et une capture lors d’un échec CI ;
- tester les tailles mobile, tablette et desktop ;
- séparer tests de calcul, tests de composants et parcours E2E.

Ne jamais valider un calcul uniquement par snapshot visuel.