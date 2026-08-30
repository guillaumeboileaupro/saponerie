import { open, save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { ADDITIVE_CATEGORIES, type AdditiveCategory, type EditorAdditive } from "./additives";
import { isValidPositiveDecimal } from "./decimal";
import { fatsDatasetVersion, getFatsCatalog } from "./fatsCatalog";
import { resolveImportedIngredients } from "./resolveImportedIngredients";
import {
  computeBeeswaxMass,
  isBeeswaxRow,
  type EditorIngredient,
  type RecipeEditorState,
  type WaterModeKind,
} from "./state";

const FORMAT_VERSION = 1;

// Bornes de sécurité pour un fichier importé : une frontière externe n'est
// jamais supposée bien formée, même si elle prétend être au format JSON
// attendu. Ces plafonds n'ont pas vocation métier (contrairement aux
// bornes de §4.6 de docs/PROJECT_CONTEXT.md, appliquées par le moteur) :
// ils évitent seulement qu'un fichier corrompu ou hostile ne produise des
// chaînes disproportionnées ou des milliers de lignes fantômes dans l'UI.
const MAX_STRING_LENGTH = 200;
const MAX_INGREDIENTS = 200;
const MAX_ADDITIVES = 200;
const WATER_MODE_KINDS: ReadonlySet<string> = new Set([
  "concentration",
  "waterLyeRatio",
  "percentOfOils",
]);
const ADDITIVE_CATEGORY_VALUES: ReadonlySet<string> = new Set(
  ADDITIVE_CATEGORIES.map((category) => category.value),
);

interface ExportedFat {
  id: string;
  displayName: string;
  sapNaOH: string;
  sapKOH: string | null;
  isUserDefined: boolean;
  /** Provenance informative uniquement : jamais utilisée pour décider si un
   * ingrédient importé est fiable (voir resolveImportedIngredients.ts, qui
   * l'ignore volontairement et retombe toujours sur `user_defined` pour un
   * identifiant inconnu localement). */
  source: string;
  status: string;
  verifiedAt: string | null;
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
          source: entry?.source ?? "inconnue",
          status: entry?.status ?? "user_defined",
          verifiedAt: entry?.verifiedAt ?? null,
        },
        massGrams: isBeeswaxRow(row)
          ? (computeBeeswaxMass(state.ingredients, row) ?? "0")
          : row.massGrams,
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

function isBoundedString(value: unknown, maxLength = MAX_STRING_LENGTH): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

/** Décimal positif syntaxiquement valide et de longueur raisonnable — les
 * bornes métier (surgras 0-30 %, etc.) restent du ressort du moteur Rust. */
function isValidDecimalString(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40 && isValidPositiveDecimal(value);
}

function isExportedFat(value: unknown): value is ExportedFat {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isBoundedString(candidate.id) &&
    isBoundedString(candidate.displayName) &&
    isValidDecimalString(candidate.sapNaOH) &&
    (candidate.sapKOH === null || isValidDecimalString(candidate.sapKOH)) &&
    isBoundedString(candidate.source) &&
    isBoundedString(candidate.status) &&
    (candidate.verifiedAt === null || isBoundedString(candidate.verifiedAt))
  );
}

function isExportedIngredient(value: unknown): value is ExportedIngredient {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (!isExportedFat(candidate.fat) || !isValidDecimalString(candidate.massGrams)) {
    return false;
  }
  return candidate.beeswaxPercent === undefined || isValidDecimalString(candidate.beeswaxPercent);
}

function isExportedAdditive(value: unknown): value is ExportedAdditive {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isBoundedString(candidate.name) &&
    typeof candidate.category === "string" &&
    ADDITIVE_CATEGORY_VALUES.has(candidate.category) &&
    isValidDecimalString(candidate.massGrams)
  );
}

/**
 * Validation structurelle ET syntaxique d'un fichier importé : une
 * frontière externe n'est jamais supposée fiable, même au format JSON
 * attendu. Vérifie la version de format exacte, les méthodes d'eau et
 * catégories d'additif autorisées, le format décimal de chaque nombre, et
 * plafonne la taille des tableaux et chaînes pour éviter qu'un fichier
 * corrompu ou hostile ne produise un état incohérent dans l'éditeur.
 */
export function isExportedRecipe(value: unknown): value is ExportedRecipe {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  if (candidate.formatVersion !== FORMAT_VERSION) return false;
  if (!isValidDecimalString(candidate.superfatPercent)) return false;
  if (!isValidDecimalString(candidate.lyePurityPercent)) return false;

  const waterMode = candidate.waterMode as Record<string, unknown> | undefined;
  if (
    !waterMode ||
    typeof waterMode.kind !== "string" ||
    !WATER_MODE_KINDS.has(waterMode.kind) ||
    !isValidDecimalString(waterMode.value)
  ) {
    return false;
  }

  if (
    !Array.isArray(candidate.ingredients) ||
    candidate.ingredients.length === 0 ||
    candidate.ingredients.length > MAX_INGREDIENTS ||
    !candidate.ingredients.every(isExportedIngredient)
  ) {
    return false;
  }

  if (
    !Array.isArray(candidate.additives) ||
    candidate.additives.length > MAX_ADDITIVES ||
    !candidate.additives.every(isExportedAdditive)
  ) {
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
    await invoke("ecrire_fichier_recette", {
      chemin: path,
      contenu: JSON.stringify(buildExportedRecipe(state), null, 2),
    });
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
    const content = await invoke<string>("lire_fichier_recette", { chemin: path });
    parsed = JSON.parse(content);
  } catch (error) {
    return { ok: false, message: `Fichier illisible ou JSON invalide : ${String(error)}` };
  }

  if (!isExportedRecipe(parsed)) {
    return { ok: false, message: "Ce fichier n'a pas le format attendu d'une recette La Saponnerie." };
  }

  const ingredients: EditorIngredient[] = resolveImportedIngredients(
    parsed.ingredients.map((imported) => ({
      fatId: imported.fat.id,
      fatDisplayName: imported.fat.displayName,
      sapNaOH: imported.fat.sapNaOH,
      sapKOH: imported.fat.sapKOH,
      massGrams: imported.massGrams,
      beeswaxPercent: imported.beeswaxPercent,
    })),
  );

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
