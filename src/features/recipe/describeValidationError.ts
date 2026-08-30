import type { ValidationError } from "../../core/types";

export function describeValidationError(error: ValidationError): string {
  switch (error.type) {
    case "emptyRecipe":
      return "La recette ne contient aucun corps gras.";
    case "nonPositiveMass":
      return `Masse invalide pour « ${error.details.fatId} ».`;
    case "missingOrNonPositiveSapNaOh":
      return `Indice SAP NaOH manquant ou invalide pour « ${error.details.fatId} ».`;
    case "superfatOutOfRange":
      return `Surgras hors bornes autorisées (${error.details} %, entre 0 et 30 %).`;
    case "lyePurityOutOfRange":
      return `Pureté de soude hors bornes autorisées (${error.details} %, entre 0 exclu et 100 %).`;
    case "concentrationOutOfRange":
      return `Concentration de soude hors bornes (${error.details}, strictement entre 0 et 1).`;
    case "waterLyeRatioOutOfRange":
      return `Ratio eau/soude hors bornes (${error.details}, doit être positif).`;
    case "percentOfOilsOutOfRange":
      return `Pourcentage d'eau hors bornes (${error.details} %, entre 0 exclu et 100 %).`;
  }
}
