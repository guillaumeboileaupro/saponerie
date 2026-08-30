/**
 * Types miroir du moteur Rust (`core/src/types.rs`). Les décimaux traversent
 * la frontière Tauri sous forme de chaînes (voir
 * `docs/decisions/0002-langage-moteur-decimal.md`) : ne jamais les convertir
 * en `number` avant l'affichage final, sous peine de réintroduire une dérive
 * de flottant binaire que le moteur évite justement.
 */

export interface Fat {
  id: string;
  displayName: string;
  sapNaOH: string;
  sapKOH: string | null;
}

export interface RecipeIngredient {
  fat: Fat;
  massGrams: string;
}

export type WaterMode =
  | { mode: "concentration"; value: string }
  | { mode: "waterLyeRatio"; value: string }
  | { mode: "percentOfOils"; value: string };

export interface RecipeInput {
  ingredients: RecipeIngredient[];
  superfatPercent: string;
  lyePurityPercent: string;
  waterMode: WaterMode;
}

export interface IngredientShare {
  fatId: string;
  massGrams: string;
  percentOfOils: string;
}

export interface CalculationResult {
  totalFatGrams: string;
  theoreticalNaohGrams: string;
  discountedNaohGrams: string;
  weighedNaohGrams: string;
  waterGrams: string;
  totalBatchGrams: string;
  ingredientBreakdown: IngredientShare[];
  assumptions: string[];
  warnings: string[];
}

export type ValidationError =
  | { type: "emptyRecipe" }
  | { type: "nonPositiveMass"; details: { fatId: string } }
  | { type: "missingOrNonPositiveSapNaOh"; details: { fatId: string } }
  | { type: "superfatOutOfRange"; details: string }
  | { type: "lyePurityOutOfRange"; details: string }
  | { type: "concentrationOutOfRange"; details: string }
  | { type: "waterLyeRatioOutOfRange"; details: string }
  | { type: "percentOfOilsOutOfRange"; details: string };

const VALIDATION_ERROR_TYPES: ReadonlySet<ValidationError["type"]> = new Set([
  "emptyRecipe",
  "nonPositiveMass",
  "missingOrNonPositiveSapNaOh",
  "superfatOutOfRange",
  "lyePurityOutOfRange",
  "concentrationOutOfRange",
  "waterLyeRatioOutOfRange",
  "percentOfOilsOutOfRange",
]);

function isValidationError(value: unknown): value is ValidationError {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }
  return VALIDATION_ERROR_TYPES.has((value as { type: ValidationError["type"] }).type);
}

/**
 * Distingue une vraie erreur métier du moteur (Rust a répondu avec un
 * `Err(Vec<ValidationError>)`, une réponse normale et attendue) d'une
 * erreur technique IPC (arguments malformés, panique, plugin absent...).
 * Sans ce garde, toute erreur technique était auparavant affichée comme si
 * elle décrivait un champ de recette invalide.
 */
export function isValidationErrorArray(value: unknown): value is ValidationError[] {
  return Array.isArray(value) && value.every(isValidationError);
}
