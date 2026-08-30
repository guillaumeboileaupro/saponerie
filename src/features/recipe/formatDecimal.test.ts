import { describe, expect, it } from "vitest";
import { formatDecimal } from "./formatDecimal";

describe("formatDecimal", () => {
  it("arrondit un développement décimal long produit par une division", () => {
    // Cas réel rencontré : NaOH / pureté (99 %) produit un développement
    // périodique que le moteur ne doit jamais arrondir lui-même.
    expect(formatDecimal("41.14747474747474747474747474747", 1)).toBe("41.1");
    expect(formatDecimal("41.14747474747474747474747474747", 2)).toBe("41.15");
  });

  it("arrondit à la moitié supérieure", () => {
    expect(formatDecimal("9.96", 1)).toBe("10.0");
    expect(formatDecimal("0.05", 1)).toBe("0.1");
  });

  it("conserve les entiers exacts avec des décimales à zéro", () => {
    expect(formatDecimal("100", 1)).toBe("100.0");
    expect(formatDecimal("133", 0)).toBe("133");
  });

  it("gère les nombres négatifs", () => {
    expect(formatDecimal("-5.06", 1)).toBe("-5.1");
  });

  it("ne perd pas de précision sur un cas de référence documentaire", () => {
    expect(formatDecimal("102.9325", 1)).toBe("102.9");
  });
});
