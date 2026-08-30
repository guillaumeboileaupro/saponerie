import { expect, test } from "@playwright/test";
import { addIngredient } from "./support/actions";
import { installTauriMock } from "./support/mockTauri";

test.beforeEach(async ({ page }) => {
  await installTauriMock(page);
  await page.goto("/");
});

test("enregistrer une recette puis la rouvrir restitue son contenu", async ({ page }) => {
  await page.locator("#recipe-name").fill("Savon de test");
  await addIngredient(page, "Olive", "320");

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Recette enregistrée.")).toBeVisible();
  await expect(page.getByText("Savon de test", { exact: true })).toBeVisible();

  // Modifier la recette en cours pour prouver que "Ouvrir" restitue
  // vraiment les données enregistrées plutôt que de laisser l'état inchangé.
  await page.getByRole("button", { name: /Retirer Olive/ }).click();
  await expect(page.getByText("Complétez la recette")).toBeVisible();

  await page.getByRole("button", { name: "Ouvrir" }).click();

  await expect(page.getByText(/chargée\.$/)).toBeVisible();
  await expect(page.locator("tr", { hasText: "Olive" }).locator("input.mass-input")).toHaveValue("320");
});

test("dupliquer une recette enregistrée crée une copie indépendante", async ({ page }) => {
  await page.locator("#recipe-name").fill("Original");
  await addIngredient(page, "Olive", "100");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Recette enregistrée.")).toBeVisible();

  await page.getByRole("button", { name: "Dupliquer" }).click();

  await expect(page.getByText("Original (copie)")).toBeVisible();
  await expect(page.getByText("Original", { exact: true })).toBeVisible();
  await expect(page.locator(".saved-recipes-list li")).toHaveCount(2);
});

test("supprimer une recette enregistrée la retire de la liste", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  await page.locator("#recipe-name").fill("À supprimer");
  await addIngredient(page, "Olive", "100");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("À supprimer", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Supprimer" }).click();

  await expect(page.getByText("À supprimer", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Aucune recette enregistrée")).toBeVisible();
});
