import type { Page } from "@playwright/test";

/**
 * L'application réelle ne fonctionne qu'à l'intérieur du runtime Tauri
 * (IPC natif). Pour tester l'interface de bout en bout sans dépendre d'un
 * binaire compilé (impossible à automatiser simplement sur les trois OS),
 * on simule `window.__TAURI_INTERNALS__.invoke` — le même point d'entrée
 * que celui documenté par `@tauri-apps/api/mocks` (`mockIPC`). La
 * correction des FORMULES reste garantie par les 38 tests Rust ; ce mock
 * ne vérifie que la réaction de l'UI à des réponses représentatives
 * (succès, erreur métier, erreur technique).
 *
 * Réimplémentation volontairement simplifiée (flottants JS, pas de
 * `Decimal`) : suffisante pour un double de test, jamais pour un calcul
 * réel. Ne jamais copier cette logique ailleurs que dans les tests.
 */
export async function installTauriMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    interface MockIngredient {
      fat: { id: string; displayName: string; sapNaOH: string; sapKOH: string | null };
      massGrams: string;
    }
    interface MockRecipeInput {
      ingredients: MockIngredient[];
      superfatPercent: string;
      lyePurityPercent: string;
      waterMode: { mode: string; value: string };
    }

    const isValidPositiveDecimal = (value: unknown): boolean =>
      typeof value === "string" && /^\d+(\.\d+)?$/.test(value.trim());

    function calculerRecette(input: MockRecipeInput) {
      const errors: Array<{ type: string; details?: unknown }> = [];

      if (!input.ingredients || input.ingredients.length === 0) {
        errors.push({ type: "emptyRecipe" });
      }
      for (const ingredient of input.ingredients ?? []) {
        if (!isValidPositiveDecimal(ingredient.massGrams) || Number(ingredient.massGrams) <= 0) {
          errors.push({ type: "nonPositiveMass", details: { fatId: ingredient.fat.id } });
        }
      }
      const superfat = Number(input.superfatPercent);
      if (!(superfat >= 0 && superfat <= 30)) {
        errors.push({ type: "superfatOutOfRange", details: input.superfatPercent });
      }
      const purity = Number(input.lyePurityPercent);
      if (!(purity > 0 && purity <= 100)) {
        errors.push({ type: "lyePurityOutOfRange", details: input.lyePurityPercent });
      }
      const mode = input.waterMode;
      if (mode?.mode === "concentration") {
        const c = Number(mode.value);
        if (!(c > 0 && c < 1)) errors.push({ type: "concentrationOutOfRange", details: mode.value });
      } else if (mode?.mode === "waterLyeRatio") {
        if (!(Number(mode.value) > 0)) {
          errors.push({ type: "waterLyeRatioOutOfRange", details: mode.value });
        }
      } else if (mode?.mode === "percentOfOils") {
        const w = Number(mode.value);
        if (!(w > 0 && w <= 100)) errors.push({ type: "percentOfOilsOutOfRange", details: mode.value });
      }

      if (errors.length > 0) {
        return Promise.reject(errors);
      }

      const totalFat = input.ingredients.reduce((sum, i) => sum + Number(i.massGrams), 0);
      const theoretical = input.ingredients.reduce(
        (sum, i) => sum + Number(i.massGrams) * Number(i.fat.sapNaOH),
        0,
      );
      const discounted = theoretical * (1 - superfat / 100);
      const weighed = discounted / (purity / 100);
      let water: number;
      if (mode.mode === "percentOfOils") {
        water = (totalFat * Number(mode.value)) / 100;
      } else if (mode.mode === "waterLyeRatio") {
        water = weighed * Number(mode.value);
      } else {
        const c = Number(mode.value);
        water = (weighed * (1 - c)) / c;
      }
      const totalBatch = totalFat + weighed + water;
      const warnings: string[] = [];
      if (superfat > 15) {
        warnings.push(
          `Surgras de ${superfat} % au-dessus de la plage usuelle (0–15 %) : vérifier la recette.`,
        );
      }

      return Promise.resolve({
        totalFatGrams: String(totalFat),
        theoreticalNaohGrams: String(theoretical),
        discountedNaohGrams: String(discounted),
        weighedNaohGrams: String(weighed),
        waterGrams: String(water),
        totalBatchGrams: String(totalBatch),
        ingredientBreakdown: input.ingredients.map((i) => ({
          fatId: i.fat.id,
          massGrams: i.massGrams,
          percentOfOils: String((Number(i.massGrams) / totalFat) * 100),
        })),
        assumptions: [
          `Surgras appliqué : ${input.superfatPercent} %`,
          `Pureté de la soude : ${input.lyePurityPercent} %`,
          "Méthode eau : mock E2E",
        ],
        warnings,
      });
    }

    const files = new Map<string, string>();
    files.set("/mock/malformed.json", "{ ceci n'est pas du JSON valide");
    files.set("/mock/wrong-shape.json", JSON.stringify({ hello: "world" }));

    interface StoredRecipe {
      id: string;
      name: string;
      updatedAt: number;
      [key: string]: unknown;
    }
    const recipes = new Map<string, StoredRecipe>();
    let nextRecipeId = 1;
    let nextOpenPath = "/mock/export.json";

    (window as unknown as { __setNextOpenPath__: (path: string) => void }).__setNextOpenPath__ = (
      path: string,
    ) => {
      nextOpenPath = path;
    };

    interface TauriInternalsMock {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
      transformCallback: () => number;
      unregisterCallback: () => void;
    }

    (window as unknown as { __TAURI_INTERNALS__: TauriInternalsMock }).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args: Record<string, unknown> = {}) => {
        switch (cmd) {
          case "calculer_recette":
            return calculerRecette(args.input as MockRecipeInput);
          case "plugin:dialog|save":
            return "/mock/export.json";
          case "plugin:dialog|open":
            return nextOpenPath;
          case "ecrire_fichier_recette":
            files.set(args.chemin as string, args.contenu as string);
            return null;
          case "lire_fichier_recette": {
            const path = args.chemin as string;
            if (!files.has(path)) {
              return Promise.reject(`Fichier introuvable : ${path}`);
            }
            return files.get(path);
          }
          case "sauvegarder_recette": {
            const recette = args.recette as { id: string | null; name: string };
            const id = recette.id ?? `mock-${nextRecipeId++}`;
            recipes.set(id, { ...recette, id, updatedAt: Date.now() });
            return id;
          }
          case "lister_recettes":
            return Array.from(recipes.values())
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((r) => ({ id: r.id, name: r.name, updatedAt: r.updatedAt }));
          case "charger_recette":
            return recipes.get(args.id as string) ?? null;
          case "dupliquer_recette": {
            const original = recipes.get(args.id as string);
            if (!original) return null;
            const newId = `mock-${nextRecipeId++}`;
            recipes.set(newId, {
              ...original,
              id: newId,
              name: `${original.name} (copie)`,
              updatedAt: Date.now(),
            });
            return newId;
          }
          case "supprimer_recette":
            recipes.delete(args.id as string);
            return null;
          default:
            throw new Error(`Commande non simulée dans le mock E2E : ${cmd}`);
        }
      },
      transformCallback: () => 0,
      unregisterCallback: () => {},
    };
  });
}

/** Définit le chemin renvoyé par le prochain appel simulé au sélecteur de
 * fichier natif (`plugin:dialog|open`), pour choisir quel fichier "ouvrir"
 * dans un scénario d'import. */
export async function setNextOpenPath(page: Page, path: string): Promise<void> {
  await page.evaluate((p) => {
    (window as unknown as { __setNextOpenPath__: (path: string) => void }).__setNextOpenPath__(p);
  }, path);
}
