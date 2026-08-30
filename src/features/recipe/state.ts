import { fatsCatalog } from "./fatsCatalog";
import { isValidPositiveDecimal } from "./decimal";
import type { RecipeIngredient, RecipeInput, WaterMode } from "../../core/types";

export type WaterModeKind = WaterMode["mode"];

export interface EditorIngredient {
  key: string;
  catalogId: string;
  massGrams: string;
}

export interface RecipeEditorState {
  ingredients: EditorIngredient[];
  superfatPercent: string;
  lyePurityPercent: string;
  waterModeKind: WaterModeKind;
  waterModeValue: string;
}

// Valeurs initiales explicites et modifiables (§3 de docs/PROJECT_CONTEXT.md) :
// surgras et méthode d'eau dans la plage usuelle proposée en §4.6, pureté
// alignée sur une soude commerciale courante à 99 %.
export const initialRecipeEditorState: RecipeEditorState = {
  ingredients: [],
  superfatPercent: "5",
  lyePurityPercent: "99",
  waterModeKind: "percentOfOils",
  waterModeValue: "35",
};

function newRowKey(): string {
  return crypto.randomUUID();
}

export function addIngredientRow(state: RecipeEditorState, catalogId: string): RecipeEditorState {
  return {
    ...state,
    ingredients: [...state.ingredients, { key: newRowKey(), catalogId, massGrams: "" }],
  };
}

export function removeIngredientRow(state: RecipeEditorState, key: string): RecipeEditorState {
  return { ...state, ingredients: state.ingredients.filter((row) => row.key !== key) };
}

export function updateIngredientMass(
  state: RecipeEditorState,
  key: string,
  massGrams: string,
): RecipeEditorState {
  return {
    ...state,
    ingredients: state.ingredients.map((row) => (row.key === key ? { ...row, massGrams } : row)),
  };
}

export function moveIngredientRow(
  state: RecipeEditorState,
  key: string,
  direction: "up" | "down",
): RecipeEditorState {
  const index = state.ingredients.findIndex((row) => row.key === key);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || targetIndex < 0 || targetIndex >= state.ingredients.length) {
    return state;
  }
  const ingredients = [...state.ingredients];
  const [row] = ingredients.splice(index, 1);
  ingredients.splice(targetIndex, 0, row);
  return { ...state, ingredients };
}

/**
 * Construit l'entrée du moteur uniquement si tous les champs sont
 * syntaxiquement valides. Renvoie `null` sinon : §3 de
 * docs/PROJECT_CONTEXT.md impose de ne présenter des résultats comme
 * utilisables qu'une fois tous les champs validés, jamais un calcul
 * partiel sur des champs incomplets.
 */
export function buildRecipeInput(state: RecipeEditorState): RecipeInput | null {
  if (state.ingredients.length === 0) {
    return null;
  }

  const ingredients: RecipeIngredient[] = [];
  for (const row of state.ingredients) {
    const entry = fatsCatalog.find((candidate) => candidate.fat.id === row.catalogId);
    if (!entry || !isValidPositiveDecimal(row.massGrams)) {
      return null;
    }
    ingredients.push({ fat: entry.fat, massGrams: row.massGrams.trim() });
  }

  if (
    !isValidPositiveDecimal(state.superfatPercent) ||
    !isValidPositiveDecimal(state.lyePurityPercent) ||
    !isValidPositiveDecimal(state.waterModeValue)
  ) {
    return null;
  }

  const waterMode = { mode: state.waterModeKind, value: state.waterModeValue.trim() } as WaterMode;

  return {
    ingredients,
    superfatPercent: state.superfatPercent.trim(),
    lyePurityPercent: state.lyePurityPercent.trim(),
    waterMode,
  };
}
