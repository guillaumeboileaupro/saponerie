import { describe, expect, it } from "vitest";
import {
  addAdditive,
  addIngredientRow,
  buildRecipeInput,
  computeBeeswaxMass,
  computeOtherOilsTotal,
  initialRecipeEditorState,
  isBeeswaxRow,
  moveIngredientRow,
  removeAdditive,
  removeIngredientRow,
  updateAdditive,
  updateBeeswaxPercent,
  updateIngredientMass,
  type RecipeEditorState,
} from "./state";

function withIngredient(catalogId: string, massGrams?: string): RecipeEditorState {
  let state = addIngredientRow(initialRecipeEditorState, catalogId);
  if (massGrams !== undefined) {
    const key = state.ingredients[0].key;
    state = updateIngredientMass(state, key, massGrams);
  }
  return state;
}

describe("addIngredientRow", () => {
  it("crée une ligne normale avec une masse vide", () => {
    const state = addIngredientRow(initialRecipeEditorState, "olive");
    expect(state.ingredients).toHaveLength(1);
    expect(state.ingredients[0].catalogId).toBe("olive");
    expect(state.ingredients[0].massGrams).toBe("");
    expect(isBeeswaxRow(state.ingredients[0])).toBe(false);
  });

  it("initialise la cire d'abeille avec un pourcentage par défaut de 4 %, jamais une masse libre", () => {
    const state = addIngredientRow(initialRecipeEditorState, "cire-abeille");
    const row = state.ingredients[0];
    expect(isBeeswaxRow(row)).toBe(true);
    expect(row.beeswaxPercent).toBe("4");
    expect(row.massGrams).toBe("");
  });
});

describe("removeIngredientRow / moveIngredientRow", () => {
  it("retire la bonne ligne par clé", () => {
    let state = addIngredientRow(initialRecipeEditorState, "olive");
    state = addIngredientRow(state, "coco");
    const idToRemove = state.ingredients[0].key;

    state = removeIngredientRow(state, idToRemove);

    expect(state.ingredients).toHaveLength(1);
    expect(state.ingredients[0].catalogId).toBe("coco");
  });

  it("déplace une ligne vers le haut/bas sans effet hors limites", () => {
    let state = addIngredientRow(initialRecipeEditorState, "olive");
    state = addIngredientRow(state, "coco");
    const [first, second] = state.ingredients;

    const movedUp = moveIngredientRow(state, first.key, "up");
    expect(movedUp.ingredients.map((r) => r.catalogId)).toEqual(["olive", "coco"]); // déjà en haut

    const movedDown = moveIngredientRow(state, first.key, "down");
    expect(movedDown.ingredients.map((r) => r.catalogId)).toEqual(["coco", "olive"]);

    const noOp = moveIngredientRow(state, second.key, "down");
    expect(noOp.ingredients.map((r) => r.catalogId)).toEqual(["olive", "coco"]); // déjà en bas
  });
});

describe("computeOtherOilsTotal / computeBeeswaxMass", () => {
  it("calcule la masse de cire d'abeille à partir des AUTRES corps gras, jamais de la soude", () => {
    let state = withIngredient("olive", "320");
    state = addIngredientRow(state, "coco");
    state = updateIngredientMass(state, state.ingredients[1].key, "200");
    state = addIngredientRow(state, "cire-abeille");

    const beeswaxRow = state.ingredients[2];
    expect(computeOtherOilsTotal(state.ingredients)).toBe("520");
    expect(computeBeeswaxMass(state.ingredients, beeswaxRow)).toBe("20.80");
  });

  it("renvoie null tant qu'une masse normale n'est pas valide", () => {
    let state = withIngredient("olive"); // masse vide
    state = addIngredientRow(state, "cire-abeille");
    expect(computeOtherOilsTotal(state.ingredients)).toBeNull();
    expect(computeBeeswaxMass(state.ingredients, state.ingredients[1])).toBeNull();
  });

  it("recalcule automatiquement si le pourcentage de cire change", () => {
    let state = withIngredient("olive", "500");
    state = addIngredientRow(state, "cire-abeille");
    let beeswaxRow = state.ingredients[1];
    expect(computeBeeswaxMass(state.ingredients, beeswaxRow)).toBe("20.00");

    state = updateBeeswaxPercent(state, beeswaxRow.key, "10");
    beeswaxRow = state.ingredients[1];
    expect(computeBeeswaxMass(state.ingredients, beeswaxRow)).toBe("50.00");
  });
});

describe("buildRecipeInput", () => {
  it("renvoie null pour une recette vide", () => {
    expect(buildRecipeInput(initialRecipeEditorState)).toBeNull();
  });

  it("renvoie null tant qu'un champ n'est pas rempli (§3 : pas de résultat partiel)", () => {
    const state = withIngredient("olive"); // masse vide
    expect(buildRecipeInput(state)).toBeNull();
  });

  it("construit une entrée valide pour le moteur (cas A simplifié)", () => {
    const state = withIngredient("olive", "320");
    const input = buildRecipeInput(state);
    expect(input).not.toBeNull();
    expect(input?.ingredients).toEqual([
      { fat: { id: "olive", displayName: "Olive", sapNaOH: "0.134", sapKOH: null }, massGrams: "320" },
    ]);
    expect(input?.superfatPercent).toBe("5");
    expect(input?.waterMode).toEqual({ mode: "percentOfOils", value: "35" });
  });

  it("résout la masse de cire d'abeille avant de construire l'entrée moteur", () => {
    let state = withIngredient("olive", "320");
    state = addIngredientRow(state, "coco");
    state = updateIngredientMass(state, state.ingredients[1].key, "200");
    state = addIngredientRow(state, "cire-abeille");

    const input = buildRecipeInput(state);
    const beeswaxIngredient = input?.ingredients.find((i) => i.fat.id === "cire-abeille");
    expect(beeswaxIngredient?.massGrams).toBe("20.80");
  });

  it("renvoie null si l'identifiant du corps gras est inconnu du catalogue", () => {
    const state = withIngredient("ingredient-inexistant", "100");
    expect(buildRecipeInput(state)).toBeNull();
  });
});

describe("additifs", () => {
  it("ajoute, modifie et retire un additif", () => {
    let state = addAdditive(initialRecipeEditorState);
    expect(state.additives).toHaveLength(1);

    const key = state.additives[0].key;
    state = updateAdditive(state, key, { name: "Argile verte", massGrams: "15" });
    expect(state.additives[0].name).toBe("Argile verte");
    expect(state.additives[0].massGrams).toBe("15");

    state = removeAdditive(state, key);
    expect(state.additives).toHaveLength(0);
  });
});
