import { invoke } from "@tauri-apps/api/core";
import { isValidationErrorArray, type CalculationResult, type RecipeInput, type ValidationError } from "./types";

export type CalculateRecipeOutcome =
  | { ok: true; result: CalculationResult }
  | { ok: false; kind: "validation"; errors: ValidationError[] }
  | { ok: false; kind: "technical"; message: string };

/**
 * Seul point d'entrée du moteur de calcul pour l'UI : délègue entièrement
 * à la commande Tauri `calculer_recette`, qui appelle le crate Rust
 * `saponerie-core`. Aucune formule métier ne doit être réimplémentée ici.
 *
 * Deux natures d'échec bien distinctes : `validation` (le moteur a
 * correctement rejeté une recette invalide, réponse normale) et
 * `technical` (l'appel IPC lui-même a échoué — arguments malformés, plugin
 * absent, panique côté Rust). Les confondre affichait par le passé un
 * message de champ invalide pour n'importe quelle erreur technique.
 */
export async function calculateRecipe(input: RecipeInput): Promise<CalculateRecipeOutcome> {
  try {
    const result = await invoke<CalculationResult>("calculer_recette", { input });
    return { ok: true, result };
  } catch (cause) {
    if (isValidationErrorArray(cause)) {
      return { ok: false, kind: "validation", errors: cause };
    }
    return { ok: false, kind: "technical", message: String(cause) };
  }
}
