import { describe, expect, it } from "vitest";
import { addDecimal, percentOf, sumDecimals } from "./decimalMath";

describe("addDecimal", () => {
  it("additionne deux entiers", () => {
    expect(addDecimal("100", "13.2")).toBe("113.2");
  });

  it("aligne les échelles différentes sans dérive", () => {
    // Le cas classique de dérive en flottant binaire IEEE-754 (0.1 + 0.2 =
    // 0.30000000000000004) doit produire un résultat exact ici.
    expect(addDecimal("0.1", "0.2")).toBe("0.3");
  });

  it("gère les nombres négatifs", () => {
    expect(addDecimal("-5", "3")).toBe("-2");
  });
});

describe("sumDecimals", () => {
  it("additionne une liste de masses", () => {
    expect(sumDecimals(["100", "100", "30", "100"])).toBe("330");
  });

  it("renvoie 0 pour une liste vide", () => {
    expect(sumDecimals([])).toBe("0");
  });

  it("l'ordre des valeurs ne change pas le résultat", () => {
    const a = sumDecimals(["13.2", "100", "0.069"]);
    const b = sumDecimals(["0.069", "13.2", "100"]);
    expect(a).toBe(b);
  });
});

describe("percentOf", () => {
  it("calcule un pourcentage exact (cas cire d'abeille)", () => {
    // 4 % de la masse des autres corps gras — jamais de la soude (voir
    // state.ts, BEESWAX_ID).
    expect(percentOf("330", "4")).toBe("13.20");
  });

  it("calcule 35 % de la masse des corps gras (cas de référence documentaire)", () => {
    expect(percentOf("343.2", "35")).toBe("120.120");
  });

  it("renvoie 0 pour une base nulle", () => {
    expect(percentOf("0", "4")).toBe("0.00");
  });
});
