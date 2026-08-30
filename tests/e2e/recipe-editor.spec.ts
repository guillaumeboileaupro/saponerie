import { expect, test } from "@playwright/test";
import { addIngredient } from "./support/actions";
import { installTauriMock } from "./support/mockTauri";

function resultRow(page: import("@playwright/test").Page, label: string) {
  return page.locator(".results-row", { hasText: label });
}

test.beforeEach(async ({ page }) => {
  await installTauriMock(page);
  await page.goto("/");
});

test("une recette vide invite à ajouter un corps gras, sans appeler le moteur", async ({ page }) => {
  await expect(page.getByText("Complétez la recette")).toBeVisible();
});

test("une recette valide affiche des résultats cohérents", async ({ page }) => {
  await addIngredient(page, "Olive", "320");

  // 320 g × 0,134 (SAP NaOH olive) = 42,88 g de NaOH théorique, arrondi à
  // 42,9 g pour l'affichage (voir formatDecimal.ts — la valeur exacte n'est
  // jamais tronquée pour le calcul, seulement pour la présentation).
  await expect(resultRow(page, "NaOH théorique")).toContainText("42.9");
  await expect(resultRow(page, "Masse totale des corps gras")).toContainText("320");
});

test("une recette invalide (surgras hors bornes) affiche une erreur métier, pas un crash", async ({
  page,
}) => {
  await addIngredient(page, "Olive", "320");

  await page.locator("#superfat").fill("50");

  await expect(page.getByRole("alert")).toContainText("Recette non exploitable");
  await expect(page.getByRole("alert")).toContainText("Surgras hors bornes");
});

test("changer la méthode de calcul de l'eau recalcule le résultat", async ({ page }) => {
  await addIngredient(page, "Olive", "1000");

  // Méthode par défaut : 35 % des corps gras => 350 g d'eau.
  await expect(resultRow(page, "Eau")).toContainText("350");

  await page.getByRole("radio", { name: "Ratio eau / soude" }).check();
  await page.getByLabel("Valeur pour Ratio eau / soude").fill("2");

  // Avec les valeurs initiales par défaut (surgras 5 %, pureté 99 %) :
  // théorique 1000 × 0,134 = 134 ; après surgras 134 × 0,95 = 127.3 ;
  // à peser 127.3 / 0.99 ≈ 128,586 ; eau = 128,586 × 2 ≈ 257,2 g.
  await expect(resultRow(page, "Eau")).toContainText("257.2");
});

test("un surgras dans la plage usuelle ne déclenche pas d'avertissement, un surgras élevé si", async ({
  page,
}) => {
  await addIngredient(page, "Olive", "1000");
  await expect(page.locator(".results-warnings")).toHaveCount(0);

  await page.locator("#superfat").fill("20");
  await expect(page.locator(".results-warnings")).toContainText("plage usuelle");
});
