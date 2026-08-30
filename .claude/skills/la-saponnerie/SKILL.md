---
name: la-saponnerie
description: Concevoir et vérifier le moteur métier de La Saponnerie : huiles, indices SAP, NaOH/KOH, surgraissage, eau, unités et avertissements. Utiliser pour toute modification des calculs ou données de recette.
---

# La Saponnerie — domaine métier

## Principes

- Séparer le moteur de calcul pur de l’interface.
- Employer des grammes en interne et convertir uniquement aux frontières.
- Conserver pour chaque corps gras la source, la date et l’unité de son indice SAP.
- Ne jamais inventer une valeur SAP manquante.
- Distinguer strictement NaOH et KOH.
- Afficher les hypothèses et arrondis avec le résultat.
- Présenter le résultat comme une aide de formulation, jamais comme une garantie de sécurité.

## Calcul minimal

Pour chaque corps gras i de masse m_i et d’indice SAP s_i :

- alcali théorique = somme(m_i × s_i) ;
- alcali corrigé = alcali théorique × (1 - surgraissage / 100).

La méthode de calcul de l’eau doit être explicitement sélectionnée : concentration de lessive, ratio eau/alcali ou pourcentage des huiles. Ne jamais mélanger ces méthodes.

## Validation obligatoire

- refuser masses négatives, NaN, infinis et pourcentages hors limites ;
- vérifier la cohérence des unités des indices SAP ;
- tester les corps gras seuls, les mélanges et les cas limites ;
- utiliser des valeurs de référence calculées indépendamment ;
- conserver davantage de précision pendant le calcul et arrondir seulement à l’affichage.

## Sécurité

Toujours rappeler que NaOH et KOH sont corrosifs : lunettes, gants, ventilation, récipient compatible et ajout de la soude dans l’eau. Une modification des tables SAP ou des formules exige une revue et des tests.