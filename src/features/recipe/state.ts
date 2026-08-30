import { getFatsCatalog } from "./fatsCatalog";
import { isValidPositiveDecimal } from "./decimal";
import { percentOf, sumDecimals } from "./decimalMath";
import { addAdditiveRow, removeAdditiveRow, updateAdditiveField, type EditorAdditive } from "./additives";
import type { RecipeIngredient, RecipeInput, WaterMode } from "../../core/types";

export type WaterModeKind = WaterMode["mode"];

/**
 * Identifiant du corps gras nécessitant un traitement de calcul différent
 * (§5 de docs/PROJECT_CONTEXT.md) : sa masse n'est jamais saisie
 * directement par l'utilisateur, elle est déduite d'un pourcentage de la
 * masse des AUTRES corps gras de la recette (par défaut 4 %), jamais un
 * pourcentage de la soude.
 */
export const BEESWAX_ID = "cire-abeille";
export const DEFAULT_BEESWAX_PERCENT = "4";

export interface EditorIngredient {
  key: string;
  catalogId: string;
  /** Masse en grammes saisie par l'utilisateur (ingrédients normaux uniquement). */
  massGrams: string;
  /** Pourcentage des AUTRES corps gras, uniquement pour l'entrée cire d'abeille. */
  beeswaxPercent?: string;
}

export interface RecipeEditorState {
  ingredients: EditorIngredient[];
  additives: EditorAdditive[];
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
  additives: [],
  superfatPercent: "5",
  lyePurityPercent: "99",
  waterModeKind: "percentOfOils",
  waterModeValue: "35",
};

function newRowKey(): string {
  return crypto.randomUUID();
}

export function isBeeswaxRow(row: EditorIngredient): boolean {
  return row.catalogId === BEESWAX_ID;
}

export function addIngredientRow(state: RecipeEditorState, catalogId: string): RecipeEditorState {
  const row: EditorIngredient =
    catalogId === BEESWAX_ID
      ? { key: newRowKey(), catalogId, massGrams: "", beeswaxPercent: DEFAULT_BEESWAX_PERCENT }
      : { key: newRowKey(), catalogId, massGrams: "" };
  return { ...state, ingredients: [...state.ingredients, row] };
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

export function updateBeeswaxPercent(
  state: RecipeEditorState,
  key: string,
  beeswaxPercent: string,
): RecipeEditorState {
  return {
    ...state,
    ingredients: state.ingredients.map((row) => (row.key === key ? { ...row, beeswaxPercent } : row)),
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
 * Masse totale des corps gras qui ne sont pas calculés automatiquement,
 * c'est-à-dire la base sur laquelle la cire d'abeille applique son
 * pourcentage. Renvoie `null` tant qu'une masse n'est pas syntaxiquement
 * valide.
 */
export function computeOtherOilsTotal(ingredients: EditorIngredient[]): string | null {
  const massesOfNormalRows = ingredients.filter((row) => !isBeeswaxRow(row)).map((row) => row.massGrams.trim());
  if (massesOfNormalRows.some((mass) => !isValidPositiveDecimal(mass))) {
    return null;
  }
  return sumDecimals(massesOfNormalRows);
}

/**
 * Masse résolue (en grammes) d'une ligne de cire d'abeille : `null` tant
 * que le pourcentage ou la masse des autres corps gras n'est pas valide.
 */
export function computeBeeswaxMass(
  ingredients: EditorIngredient[],
  row: EditorIngredient,
): string | null {
  if (!row.beeswaxPercent || !isValidPositiveDecimal(row.beeswaxPercent)) {
    return null;
  }
  const otherOilsTotal = computeOtherOilsTotal(ingredients);
  if (otherOilsTotal === null) {
    return null;
  }
  return percentOf(otherOilsTotal, row.beeswaxPercent.trim());
}

export function addAdditive(state: RecipeEditorState): RecipeEditorState {
  return { ...state, additives: addAdditiveRow(state.additives) };
}

export function removeAdditive(state: RecipeEditorState, key: string): RecipeEditorState {
  return { ...state, additives: removeAdditiveRow(state.additives, key) };
}

export function updateAdditive(
  state: RecipeEditorState,
  key: string,
  patch: Partial<Pick<EditorAdditive, "name" | "category" | "massGrams">>,
): RecipeEditorState {
  return { ...state, additives: updateAdditiveField(state.additives, key, patch) };
}

/**
 * Remplace intégralement la recette en cours d'édition (import JSON). Les
 * clés de ligne sont régénérées pour éviter toute collision avec l'état
 * précédent.
 */
export function replaceRecipe(
  patch: Pick<
    RecipeEditorState,
    "ingredients" | "additives" | "superfatPercent" | "lyePurityPercent" | "waterModeKind" | "waterModeValue"
  >,
): RecipeEditorState {
  return { ...patch };
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

  const catalog = getFatsCatalog();
  const ingredients: RecipeIngredient[] = [];
  for (const row of state.ingredients) {
    const entry = catalog.find((candidate) => candidate.fat.id === row.catalogId);
    if (!entry) {
      return null;
    }
    const massGrams = isBeeswaxRow(row)
      ? computeBeeswaxMass(state.ingredients, row)
      : row.massGrams.trim();
    if (massGrams === null || !isValidPositiveDecimal(massGrams)) {
      return null;
    }
    ingredients.push({ fat: entry.fat, massGrams });
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
