import { isValidPositiveDecimal } from "./decimal";
import { sumDecimals } from "./decimalMath";

/**
 * Additifs séparés des corps gras (§« Après le MVP » de docs/TODO.md et
 * §5.2/§9 de docs/PROJECT_CONTEXT.md) : argiles, poudres, exfoliants,
 * fragrances, huiles essentielles. Ils ne participent JAMAIS au calcul de
 * la soude ou de l'eau — ce ne sont pas des corps gras saponifiables. Le
 * remplacement d'une partie de l'eau par un liquide (lait, infusion...)
 * n'est pas géré ici et resterait à traiter séparément pour éviter tout
 * double comptage, conformément à la même section de docs/PROJECT_CONTEXT.md.
 */
export type AdditiveCategory =
  | "argile"
  | "exfoliant"
  | "poudre"
  | "fragrance"
  | "huile-essentielle"
  | "autre";

export const ADDITIVE_CATEGORIES: { value: AdditiveCategory; label: string }[] = [
  { value: "argile", label: "Argile" },
  { value: "exfoliant", label: "Exfoliant" },
  { value: "poudre", label: "Poudre / colorant" },
  { value: "fragrance", label: "Fragrance" },
  { value: "huile-essentielle", label: "Huile essentielle" },
  { value: "autre", label: "Autre" },
];

export interface EditorAdditive {
  key: string;
  name: string;
  category: AdditiveCategory;
  massGrams: string;
}

export function addAdditiveRow(additives: EditorAdditive[]): EditorAdditive[] {
  return [...additives, { key: crypto.randomUUID(), name: "", category: "argile", massGrams: "" }];
}

export function removeAdditiveRow(additives: EditorAdditive[], key: string): EditorAdditive[] {
  return additives.filter((additive) => additive.key !== key);
}

export function updateAdditiveField(
  additives: EditorAdditive[],
  key: string,
  patch: Partial<Pick<EditorAdditive, "name" | "category" | "massGrams">>,
): EditorAdditive[] {
  return additives.map((additive) => (additive.key === key ? { ...additive, ...patch } : additive));
}

/**
 * Somme des masses d'additifs syntaxiquement valides. Les lignes vides
 * sont ignorées ; une masse renseignée mais invalide n'empêche pas de
 * compter les autres (les additifs ne bloquent jamais le calcul principal
 * de la recette, contrairement aux corps gras).
 */
export function computeAdditivesTotalMass(additives: EditorAdditive[]): string {
  const validMasses = additives
    .map((additive) => additive.massGrams.trim())
    .filter((mass) => mass !== "" && isValidPositiveDecimal(mass));
  return validMasses.length === 0 ? "0" : sumDecimals(validMasses);
}
