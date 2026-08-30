import { invoke } from "@tauri-apps/api/core";
import type { AdditiveCategory, EditorAdditive } from "./additives";
import { fatsDatasetVersion, getFatsCatalog } from "./fatsCatalog";
import { resolveImportedIngredients } from "./resolveImportedIngredients";
import type { RecipeEditorState, WaterModeKind } from "./state";

interface RecipeIngredientRecord {
  fatId: string;
  fatDisplayName: string;
  sapNaOH: string;
  sapKOH: string | null;
  massGrams: string;
  beeswaxPercent: string | null;
}

interface RecipeAdditiveRecord {
  name: string;
  category: string;
  massGrams: string;
}

interface RecipeRecord {
  id: string | null;
  name: string;
  superfatPercent: string;
  lyePurityPercent: string;
  waterModeKind: string;
  waterModeValue: string;
  datasetVersion: string;
  ingredients: RecipeIngredientRecord[];
  additives: RecipeAdditiveRecord[];
}

export interface RecipeSummary {
  id: string;
  name: string;
  updatedAt: number;
}

export interface LoadedRecipe {
  id: string;
  name: string;
  ingredients: RecipeEditorState["ingredients"];
  additives: EditorAdditive[];
  superfatPercent: string;
  lyePurityPercent: string;
  waterModeKind: WaterModeKind;
  waterModeValue: string;
}

function buildRecipeRecord(
  state: RecipeEditorState,
  name: string,
  existingId: string | null,
): RecipeRecord {
  const catalog = getFatsCatalog();
  return {
    id: existingId,
    name,
    superfatPercent: state.superfatPercent,
    lyePurityPercent: state.lyePurityPercent,
    waterModeKind: state.waterModeKind,
    waterModeValue: state.waterModeValue,
    datasetVersion: fatsDatasetVersion,
    ingredients: state.ingredients.map((row) => {
      const entry = catalog.find((candidate) => candidate.fat.id === row.catalogId);
      return {
        fatId: row.catalogId,
        fatDisplayName: entry?.fat.displayName ?? row.catalogId,
        sapNaOH: entry?.fat.sapNaOH ?? "",
        sapKOH: entry?.fat.sapKOH ?? null,
        massGrams: row.massGrams,
        beeswaxPercent: row.beeswaxPercent ?? null,
      };
    }),
    additives: state.additives.map((additive) => ({
      name: additive.name,
      category: additive.category,
      massGrams: additive.massGrams,
    })),
  };
}

/** Enregistre la recette ; renvoie l'identifiant (nouveau ou existant). */
export async function saveRecipe(
  state: RecipeEditorState,
  name: string,
  existingId: string | null,
): Promise<string> {
  return invoke<string>("sauvegarder_recette", {
    recette: buildRecipeRecord(state, name, existingId),
  });
}

export async function listRecipes(): Promise<RecipeSummary[]> {
  return invoke<RecipeSummary[]>("lister_recettes");
}

export async function loadRecipe(id: string): Promise<LoadedRecipe | null> {
  const record = await invoke<RecipeRecord | null>("charger_recette", { id });
  if (!record || !record.id) {
    return null;
  }

  const ingredients = resolveImportedIngredients(record.ingredients);
  const additives: EditorAdditive[] = record.additives.map((additive) => ({
    key: crypto.randomUUID(),
    name: additive.name,
    category: additive.category as AdditiveCategory,
    massGrams: additive.massGrams,
  }));

  return {
    id: record.id,
    name: record.name,
    ingredients,
    additives,
    superfatPercent: record.superfatPercent,
    lyePurityPercent: record.lyePurityPercent,
    waterModeKind: record.waterModeKind as WaterModeKind,
    waterModeValue: record.waterModeValue,
  };
}

export async function duplicateRecipe(id: string): Promise<string | null> {
  return invoke<string | null>("dupliquer_recette", { id });
}

export async function deleteRecipe(id: string): Promise<void> {
  await invoke("supprimer_recette", { id });
}
