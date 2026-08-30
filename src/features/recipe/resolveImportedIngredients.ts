import { addUserFat, getFatsCatalog } from "./fatsCatalog";
import { BEESWAX_ID, type EditorIngredient } from "./state";

/** Forme minimale commune à un ingrédient importé, que ce soit depuis un
 * fichier JSON (`recipeFile.ts`) ou depuis la base locale (`recipeStorage.ts`). */
export interface ImportableIngredient {
  fatId: string;
  fatDisplayName: string;
  sapNaOH: string;
  sapKOH: string | null;
  massGrams: string;
  beeswaxPercent?: string | null;
}

/**
 * Reconstruit des lignes d'éditeur à partir d'ingrédients importés. Un
 * ingrédient dont l'identifiant n'existe pas déjà dans le catalogue local
 * (ex. importé depuis une autre machine) redevient un ingrédient
 * personnalisé `user_defined`, jamais présenté comme vérifié (§5 de
 * docs/PROJECT_CONTEXT.md).
 */
export function resolveImportedIngredients(items: ImportableIngredient[]): EditorIngredient[] {
  const catalog = getFatsCatalog();
  return items.map((item) => {
    const alreadyKnown = catalog.some((candidate) => candidate.fat.id === item.fatId);
    const catalogId = alreadyKnown
      ? item.fatId
      : addUserFat(item.fatDisplayName, item.sapNaOH, item.sapKOH).fat.id;

    return catalogId === BEESWAX_ID
      ? {
          key: crypto.randomUUID(),
          catalogId,
          massGrams: "",
          beeswaxPercent: item.beeswaxPercent ?? "4",
        }
      : { key: crypto.randomUUID(), catalogId, massGrams: item.massGrams };
  });
}
