import { expect, test } from "@playwright/test";
import { addIngredient } from "./support/actions";
import { installTauriMock, setNextOpenPath } from "./support/mockTauri";

test.beforeEach(async ({ page }) => {
  await installTauriMock(page);
  await page.goto("/");
});

test("un fichier JSON syntaxiquement invalide affiche une erreur claire, sans crasher l'app", async ({
  page,
}) => {
  await setNextOpenPath(page, "/mock/malformed.json");
  await page.getByRole("button", { name: "Importer un fichier JSON" }).click();

  await expect(page.getByText(/JSON invalide/i)).toBeVisible();
  // L'application reste utilisable après l'échec d'import.
  await expect(page.getByText("Complétez la recette")).toBeVisible();
});

test("un fichier bien formé en JSON mais de forme inattendue est rejeté", async ({ page }) => {
  await setNextOpenPath(page, "/mock/wrong-shape.json");
  await page.getByRole("button", { name: "Importer un fichier JSON" }).click();

  await expect(page.getByText(/format attendu/i)).toBeVisible();
});

test("exporter puis réimporter restitue fidèlement la recette", async ({ page }) => {
  await addIngredient(page, "Olive", "320");

  await page.getByRole("button", { name: "Exporter en JSON" }).click();
  await expect(page.getByText("Recette exportée.")).toBeVisible();

  // Repartir d'une recette vide avant de réimporter, pour vérifier que
  // l'import restitue bien les données plutôt que de les laisser par
  // hasard inchangées depuis l'état précédent.
  await page.getByRole("button", { name: /Retirer Olive/ }).click();
  await expect(page.getByText("Complétez la recette")).toBeVisible();

  await setNextOpenPath(page, "/mock/export.json");
  await page.getByRole("button", { name: "Importer un fichier JSON" }).click();

  await expect(page.getByText("Recette importée.")).toBeVisible();
  await expect(page.locator("tr", { hasText: "Olive" }).locator("input.mass-input")).toHaveValue("320");
});
