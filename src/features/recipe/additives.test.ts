import { describe, expect, it } from "vitest";
import {
  addAdditiveRow,
  computeAdditivesTotalMass,
  removeAdditiveRow,
  updateAdditiveField,
} from "./additives";

describe("additives", () => {
  it("addAdditiveRow ajoute une ligne vide avec la catégorie par défaut", () => {
    const rows = addAdditiveRow([]);
    expect(rows).toHaveLength(1);
    expect(rows[0].category).toBe("argile");
    expect(rows[0].massGrams).toBe("");
  });

  it("removeAdditiveRow retire la bonne ligne", () => {
    const rows = addAdditiveRow(addAdditiveRow([]));
    const remaining = removeAdditiveRow(rows, rows[0].key);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].key).toBe(rows[1].key);
  });

  it("updateAdditiveField modifie uniquement la ligne ciblée", () => {
    const rows = addAdditiveRow(addAdditiveRow([]));
    const updated = updateAdditiveField(rows, rows[0].key, { name: "Argile verte", massGrams: "15" });
    expect(updated[0].name).toBe("Argile verte");
    expect(updated[0].massGrams).toBe("15");
    expect(updated[1].name).toBe(""); // ligne non ciblée inchangée
  });

  describe("computeAdditivesTotalMass", () => {
    it("additionne uniquement les masses syntaxiquement valides", () => {
      const rows = [
        { key: "1", name: "Argile", category: "argile" as const, massGrams: "15" },
        { key: "2", name: "Exfoliant", category: "exfoliant" as const, massGrams: "5.5" },
        { key: "3", name: "Vide", category: "autre" as const, massGrams: "" },
        { key: "4", name: "Invalide", category: "autre" as const, massGrams: "abc" },
      ];
      expect(computeAdditivesTotalMass(rows)).toBe("20.5");
    });

    it("renvoie 0 s'il n'y a aucun additif ou aucune masse valide", () => {
      expect(computeAdditivesTotalMass([])).toBe("0");
    });
  });
});
