import { expect, test } from "@playwright/test";
import { addIngredient } from "./support/actions";
import { installTauriMock } from "./support/mockTauri";

function resultRow(page: import("@playwright/test").Page, label: string) {
  return page.locator(".results-row", { hasText: label });
}

function primaryResult(page: import("@playwright/test").Page, label: string) {
  return page.locator(".primary-results > div", { hasText: label });
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

  // Les trois sorties partagent la même base de 320 g : cire 4 %, eau 35 %,
  // soude théorique réduite à 95 % avec une pureté initiale de 100 %.
  await expect(primaryResult(page, "Cire d'abeille")).toContainText("12.8");
  await expect(primaryResult(page, "Soude NaOH")).toContainText("40.7");
  await expect(primaryResult(page, "Eau")).toContainText("112.0");
  await expect(resultRow(page, "NaOH théorique")).toContainText("42.9");
  await expect(resultRow(page, "Masse totale des corps gras")).toContainText("320.0");
});

test("une recette invalide (surgras hors bornes) affiche une erreur métier, pas un crash", async ({
  page,
}) => {
  await addIngredient(page, "Olive", "320");

  await page.getByText("Réglages de la recette").click();
  await page.locator("#superfat").fill("50");

  await expect(page.getByRole("alert")).toContainText("Recette non exploitable");
  await expect(page.getByRole("alert")).toContainText("Surgras hors bornes");
});

test("changer la méthode de calcul de l'eau recalcule le résultat", async ({ page }) => {
  await addIngredient(page, "Olive", "1000");

  // Méthode par défaut : 35 % des 1000 g saisis => 350 g.
  await expect(primaryResult(page, "Eau")).toContainText("350");

  await page.getByText("Réglages de la recette").click();
  await page.getByRole("radio", { name: "Ratio eau / soude" }).check();
  await page.getByLabel("Valeur pour Ratio eau / soude").fill("2");

  // 1000 × 0,134 × 95 % = 127,3 g de soude ; ratio 2 => 254,6 g d'eau.
  await expect(primaryResult(page, "Eau")).toContainText("254.6");
});

test("un surgras dans la plage usuelle ne déclenche pas d'avertissement, un surgras élevé si", async ({
  page,
}) => {
  await addIngredient(page, "Olive", "1000");
  await expect(page.locator(".results-warnings")).toHaveCount(0);

  await page.getByText("Réglages de la recette").click();
  await page.locator("#superfat").fill("20");
  await expect(page.locator(".results-warnings")).toContainText("plage usuelle");
});
