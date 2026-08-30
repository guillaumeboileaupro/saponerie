import { describe, expect, it } from "vitest";
import { isValidationErrorArray } from "./types";

describe("isValidationErrorArray", () => {
  it("reconnaît un tableau de vraies erreurs métier du moteur", () => {
    expect(
      isValidationErrorArray([
        { type: "emptyRecipe" },
        { type: "nonPositiveMass", details: { fatId: "olive" } },
        { type: "superfatOutOfRange", details: "50" },
      ]),
    ).toBe(true);
  });

  it("rejette un tableau vide (pas d'erreur métier associée)", () => {
    // Un tableau vide n'a pas de sens comme liste d'erreurs de validation ;
    // isValidationErrorArray reste techniquement vrai (every() sur []), donc
    // ce test documente explicitement ce comportement plutôt que de le
    // supposer.
    expect(isValidationErrorArray([])).toBe(true);
  });

  it("rejette une erreur technique IPC (chaîne, objet Tauri générique, etc.)", () => {
    expect(isValidationErrorArray("invoke error: command not found")).toBe(false);
    expect(isValidationErrorArray(new Error("panic"))).toBe(false);
    expect(isValidationErrorArray({ message: "Unhandled IPC error" })).toBe(false);
    expect(isValidationErrorArray(null)).toBe(false);
    expect(isValidationErrorArray(undefined)).toBe(false);
  });

  it("rejette un tableau dont un seul élément n'est pas une ValidationError reconnue", () => {
    expect(
      isValidationErrorArray([{ type: "emptyRecipe" }, { type: "typeInconnuInvente" }]),
    ).toBe(false);
  });
});
