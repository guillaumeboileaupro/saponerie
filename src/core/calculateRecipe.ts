import { invoke } from "@tauri-apps/api/core";
import type { CalculationResult, RecipeInput, ValidationError } from "./types";

/**
 * Seul point d'entrée du moteur de calcul pour l'UI : délègue entièrement
 * à la commande Tauri `calculer_recette`, qui appelle le crate Rust
 * `saponerie-core`. Aucune formule métier ne doit être réimplémentée ici.
 */
export async function calculateRecipe(
  input: RecipeInput,
): Promise<{ ok: true; result: CalculationResult } | { ok: false; errors: ValidationError[] }> {
  try {
    const result = await invoke<CalculationResult>("calculer_recette", { input });
    return { ok: true, result };
  } catch (errors) {
    return { ok: false, errors: errors as ValidationError[] };
  }
}
