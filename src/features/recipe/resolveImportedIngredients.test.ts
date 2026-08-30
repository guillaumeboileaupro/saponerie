import { describe, expect, it } from "vitest";
import { resolveImportedIngredients } from "./resolveImportedIngredients";
import { getFatsCatalog } from "./fatsCatalog";

describe("resolveImportedIngredients", () => {
  it("réutilise l'identifiant existant pour un corps gras connu du catalogue", () => {
    const [row] = resolveImportedIngredients([
      { fatId: "olive", fatDisplayName: "Olive", sapNaOH: "0.134", sapKOH: null, massGrams: "320" },
    ]);
    expect(row.catalogId).toBe("olive");
    expect(row.massGrams).toBe("320");
  });

  it("recrée un ingrédient personnalisé pour un identifiant inconnu localement, jamais présenté comme vérifié", () => {
    const catalogBefore = getFatsCatalog().length;

    const [row] = resolveImportedIngredients([
      {
        fatId: "custom-venu-dune-autre-machine",
        fatDisplayName: "Huile mystère",
        sapNaOH: "0.14",
        sapKOH: null,
        massGrams: "50",
      },
    ]);

    const catalogAfter = getFatsCatalog();
    expect(catalogAfter.length).toBe(catalogBefore + 1);

    const createdEntry = catalogAfter.find((entry) => entry.fat.id === row.catalogId);
    expect(createdEntry?.status).toBe("user_defined");
    expect(createdEntry?.fat.displayName).toBe("Huile mystère");
    expect(row.massGrams).toBe("50");
  });

  it("place la masse en pourcentage sur la ligne cire d'abeille, jamais en grammes libres", () => {
    const [row] = resolveImportedIngredients([
      {
        fatId: "cire-abeille",
        fatDisplayName: "Cire d'abeille",
        sapNaOH: "0.069",
        sapKOH: null,
        massGrams: "20.8",
        beeswaxPercent: "4",
      },
    ]);
    expect(row.massGrams).toBe("");
    expect(row.beeswaxPercent).toBe("4");
  });

  it("utilise 4 % par défaut si le pourcentage de cire d'abeille est absent du fichier", () => {
    const [row] = resolveImportedIngredients([
      { fatId: "cire-abeille", fatDisplayName: "Cire d'abeille", sapNaOH: "0.069", sapKOH: null, massGrams: "" },
    ]);
    expect(row.beeswaxPercent).toBe("4");
  });
});
