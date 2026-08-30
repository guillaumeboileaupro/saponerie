import { describe, expect, it } from "vitest";
import { describeProvenance, filterFatsCatalog, getFatsCatalog, isUnverified } from "./fatsCatalog";

describe("filterFatsCatalog", () => {
  const catalog = getFatsCatalog();

  it("renvoie tout le catalogue pour une requête vide", () => {
    expect(filterFatsCatalog(catalog, "")).toHaveLength(catalog.length);
  });

  it("filtre par nom, insensible à la casse et aux accents", () => {
    const results = filterFatsCatalog(catalog, "KARITE");
    expect(results.some((entry) => entry.fat.displayName === "Beurre de karité")).toBe(true);
  });

  it("filtre par alias", () => {
    const results = filterFatsCatalog(catalog, "noix de coco");
    expect(results.some((entry) => entry.fat.id === "coco")).toBe(true);
  });

  it("renvoie un tableau vide si rien ne correspond", () => {
    expect(filterFatsCatalog(catalog, "ingrédient qui n'existe pas")).toHaveLength(0);
  });
});

describe("isUnverified", () => {
  it("considère documentary et user_defined comme non vérifiés", () => {
    expect(isUnverified("documentary")).toBe(true);
    expect(isUnverified("user_defined")).toBe(true);
  });

  it("considère cross_checked et verified comme vérifiés", () => {
    expect(isUnverified("cross_checked")).toBe(false);
    expect(isUnverified("verified")).toBe(false);
  });
});

describe("describeProvenance", () => {
  it("inclut la source, le statut et la date de vérification", () => {
    const entry = getFatsCatalog().find((candidate) => candidate.fat.id === "olive");
    expect(entry).toBeDefined();
    const description = describeProvenance(entry!);
    expect(description).toContain("Source :");
    expect(description).toContain("Statut :");
    expect(description).toContain(entry!.verifiedAt ?? "");
  });

  it("reste lisible pour une entrée documentaire sans date de vérification", () => {
    const entry = getFatsCatalog().find((candidate) => candidate.status === "documentary");
    expect(entry).toBeDefined();
    expect(() => describeProvenance(entry!)).not.toThrow();
  });
});
