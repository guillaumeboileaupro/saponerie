import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { AdditiveCategory, EditorAdditive } from "./additives";
import { addUserFat, fatsDatasetVersion, getFatsCatalog } from "./fatsCatalog";
import { BEESWAX_ID, type EditorIngredient, type RecipeEditorState, type WaterModeKind } from "./state";

const FORMAT_VERSION = 1;

interface ExportedFat {
  id: string;
  displayName: string;
  sapNaOH: string;
  sapKOH: string | null;
  isUserDefined: boolean;
}

interface ExportedIngredient {
  fat: ExportedFat;
  massGrams: string;
  beeswaxPercent?: string;
}

interface ExportedAdditive {
  name: string;
  category: string;
  massGrams: string;
}

interface ExportedRecipe {
  formatVersion: number;
  exportedAt: string;
  dataSetVersion: string;
  superfatPercent: string;
  lyePurityPercent: string;
  waterMode: { kind: WaterModeKind; value: string };
  ingredients: ExportedIngredient[];
  additives: ExportedAdditive[];
}

/**
 * Chaque ingrédient embarque sa définition complète (pas seulement son
 * identifiant) pour que le fichier reste exploitable sur une autre machine,
 * y compris pour des ingrédients personnalisés qui n'existent que
 * localement. La provenance/le statut d'origine ne sont volontairement pas
 * dupliqués ici : à l'import, un ingrédient inconnu redevient
 * `user_defined`, jamais présenté comme vérifié (§5 de
 * docs/PROJECT_CONTEXT.md).
 */
export function buildExportedRecipe(state: RecipeEditorState): ExportedRecipe {
  const catalog = getFatsCatalog();
  return {
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    dataSetVersion: fatsDatasetVersion,
    superfatPercent: state.superfatPercent,
    lyePurityPercent: state.lyePurityPercent,
    waterMode: { kind: state.waterModeKind, value: state.waterModeValue },
    ingredients: state.ingredients.map((row) => {
      const entry = catalog.find((candidate) => candidate.fat.id === row.catalogId);
      return {
        fat: {
          id: row.catalogId,
          displayName: entry?.fat.displayName ?? row.catalogId,
          sapNaOH: entry?.fat.sapNaOH ?? "",
          sapKOH: entry?.fat.sapKOH ?? null,
          isUserDefined: entry?.status === "user_defined",
        },
        massGrams: row.massGrams,
        beeswaxPercent: row.beeswaxPercent,
      };
    }),
    additives: state.additives.map((additive) => ({
      name: additive.name,
      category: additive.category,
      massGrams: additive.massGrams,
    })),
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string";
}

function isExportedFat(value: unknown): value is ExportedFat {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.displayName) &&
    isNonEmptyString(candidate.sapNaOH) &&
    (candidate.sapKOH === null || isNonEmptyString(candidate.sapKOH))
  );
}

function isExportedIngredient(value: unknown): value is ExportedIngredient {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return isExportedFat(candidate.fat) && isNonEmptyString(candidate.massGrams);
}

function isExportedAdditive(value: unknown): value is ExportedAdditive {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return isNonEmptyString(candidate.name) && isNonEmptyString(candidate.category) && isNonEmptyString(candidate.massGrams);
}

/** Validation structurelle d'un fichier importé : une frontière externe
 * n'est jamais supposée fiable, même au format JSON. */
function isExportedRecipe(value: unknown): value is ExportedRecipe {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.formatVersion !== "number") return false;
  if (typeof candidate.superfatPercent !== "string") return false;
  if (typeof candidate.lyePurityPercent !== "string") return false;
  const waterMode = candidate.waterMode as Record<string, unknown> | undefined;
  if (!waterMode || typeof waterMode.kind !== "string" || typeof waterMode.value !== "string") {
    return false;
  }
  if (!Array.isArray(candidate.ingredients) || !candidate.ingredients.every(isExportedIngredient)) {
    return false;
  }
  if (!Array.isArray(candidate.additives) || !candidate.additives.every(isExportedAdditive)) {
    return false;
  }
  return true;
}

export interface ImportedRecipe {
  ingredients: EditorIngredient[];
  additives: EditorAdditive[];
  superfatPercent: string;
  lyePurityPercent: string;
  waterModeKind: WaterModeKind;
  waterModeValue: string;
}

export async function exportRecipeToFile(
  state: RecipeEditorState,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const path = await save({
      title: "Exporter la recette",
      defaultPath: "recette.json",
      filters: [{ name: "Recette La Saponnerie", extensions: ["json"] }],
    });
    if (!path) {
      return { ok: false, message: "Export annulé." };
    }
    await writeTextFile(path, JSON.stringify(buildExportedRecipe(state), null, 2));
    return { ok: true };
  } catch (error) {
    return { ok: false, message: `Échec de l'export : ${String(error)}` };
  }
}

export async function importRecipeFromFile(): Promise<
  { ok: true; recipe: ImportedRecipe } | { ok: false; message: string }
> {
  let path: string | null;
  try {
    const selected = await open({
      title: "Importer une recette",
      multiple: false,
      filters: [{ name: "Recette La Saponnerie", extensions: ["json"] }],
    });
    path = Array.isArray(selected) ? (selected[0] ?? null) : selected;
  } catch (error) {
    return { ok: false, message: `Échec de l'ouverture du sélecteur de fichier : ${String(error)}` };
  }

  if (!path) {
    return { ok: false, message: "Import annulé." };
  }

  let parsed: unknown;
  try {
    const content = await readTextFile(path);
    parsed = JSON.parse(content);
  } catch (error) {
    return { ok: false, message: `Fichier illisible ou JSON invalide : ${String(error)}` };
  }

  if (!isExportedRecipe(parsed)) {
    return { ok: false, message: "Ce fichier n'a pas le format attendu d'une recette La Saponnerie." };
  }

  const catalog = getFatsCatalog();
  const ingredients: EditorIngredient[] = parsed.ingredients.map((imported) => {
    const alreadyKnown = catalog.some((candidate) => candidate.fat.id === imported.fat.id);
    const catalogId = alreadyKnown
      ? imported.fat.id
      : addUserFat(imported.fat.displayName, imported.fat.sapNaOH, imported.fat.sapKOH).fat.id;

    return catalogId === BEESWAX_ID
      ? {
          key: crypto.randomUUID(),
          catalogId,
          massGrams: "",
          beeswaxPercent: imported.beeswaxPercent ?? "4",
        }
      : { key: crypto.randomUUID(), catalogId, massGrams: imported.massGrams };
  });

  const additives: EditorAdditive[] = parsed.additives.map((additive) => ({
    key: crypto.randomUUID(),
    name: additive.name,
    category: additive.category as AdditiveCategory,
    massGrams: additive.massGrams,
  }));

  return {
    ok: true,
    recipe: {
      ingredients,
      additives,
      superfatPercent: parsed.superfatPercent,
      lyePurityPercent: parsed.lyePurityPercent,
      waterModeKind: parsed.waterMode.kind,
      waterModeValue: parsed.waterMode.value,
    },
  };
}
