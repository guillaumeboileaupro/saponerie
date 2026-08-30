import { describe, expect, it } from "vitest";
import { isExportedRecipe } from "./recipeFile";

function validRecipe(): unknown {
  return {
    formatVersion: 1,
    exportedAt: "2026-08-30T12:00:00.000Z",
    dataSetVersion: "2026-08-30",
    superfatPercent: "5",
    lyePurityPercent: "99",
    waterMode: { kind: "percentOfOils", value: "35" },
    ingredients: [
      {
        fat: {
          id: "olive",
          displayName: "Olive",
          sapNaOH: "0.134",
          sapKOH: null,
          isUserDefined: false,
          source: "support-atelier-miroir-de-venus",
          status: "cross_checked",
          verifiedAt: "2026-08-30",
        },
        massGrams: "320",
      },
    ],
    additives: [],
  };
}

describe("isExportedRecipe — validation d'un fichier importé", () => {
  it("accepte une recette exportée valide", () => {
    expect(isExportedRecipe(validRecipe())).toBe(true);
  });

  it("rejette une valeur qui n'est pas un objet", () => {
    expect(isExportedRecipe(null)).toBe(false);
    expect(isExportedRecipe("recette.json")).toBe(false);
    expect(isExportedRecipe(42)).toBe(false);
    expect(isExportedRecipe([])).toBe(false);
  });

  it("rejette une version de format différente de celle prise en charge", () => {
    const recipe = validRecipe() as Record<string, unknown>;
    recipe.formatVersion = 2;
    expect(isExportedRecipe(recipe)).toBe(false);
  });

  it("rejette un pourcentage de surgras non décimal", () => {
    const recipe = validRecipe() as Record<string, unknown>;
    recipe.superfatPercent = "cinq pour cent";
    expect(isExportedRecipe(recipe)).toBe(false);
  });

  it("rejette une méthode d'eau inconnue", () => {
    const recipe = validRecipe() as Record<string, unknown>;
    recipe.waterMode = { kind: "methodeInventee", value: "35" };
    expect(isExportedRecipe(recipe)).toBe(false);
  });

  it("rejette une recette sans aucun ingrédient", () => {
    const recipe = validRecipe() as Record<string, unknown>;
    recipe.ingredients = [];
    expect(isExportedRecipe(recipe)).toBe(false);
  });

  it("rejette plus de 200 ingrédients (protection contre un fichier hostile)", () => {
    const recipe = validRecipe() as Record<string, unknown>;
    const oneIngredient = (recipe.ingredients as unknown[])[0];
    recipe.ingredients = Array.from({ length: 201 }, () => oneIngredient);
    expect(isExportedRecipe(recipe)).toBe(false);
  });

  it("rejette un indice SAP NaOH non décimal", () => {
    const recipe = validRecipe() as { ingredients: Array<{ fat: Record<string, unknown> }> };
    recipe.ingredients[0].fat.sapNaOH = "beaucoup";
    expect(isExportedRecipe(recipe)).toBe(false);
  });

  it("rejette une catégorie d'additif inconnue", () => {
    const recipe = validRecipe() as Record<string, unknown>;
    recipe.additives = [{ name: "Mystère", category: "categorie-inventee", massGrams: "10" }];
    expect(isExportedRecipe(recipe)).toBe(false);
  });

  it("accepte un additif avec une catégorie reconnue", () => {
    const recipe = validRecipe() as Record<string, unknown>;
    recipe.additives = [{ name: "Argile verte", category: "argile", massGrams: "15" }];
    expect(isExportedRecipe(recipe)).toBe(true);
  });

  it("rejette un fichier JSON sans rapport avec une recette (ex. autre document)", () => {
    expect(isExportedRecipe({ hello: "world", nested: { a: 1 } })).toBe(false);
  });
});
