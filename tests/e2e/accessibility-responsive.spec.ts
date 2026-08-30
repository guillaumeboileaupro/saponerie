import { expect, test } from "@playwright/test";
import { installTauriMock } from "./support/mockTauri";

test.beforeEach(async ({ page }) => {
  await installTauriMock(page);
});

for (const width of [360, 768, 1280]) {
  test(`aucun débordement horizontal à ${width}px de large`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
}

test("les champs principaux sont atteignables et utilisables au clavier", async ({ page }) => {
  await page.goto("/");

  // Atteindre le champ de recherche de corps gras au clavier puis ajouter
  // un ingrédient sans jamais utiliser la souris.
  await page.locator('input[placeholder="Rechercher une huile ou un beurre…"]').focus();
  await page.keyboard.type("Olive");
  await page.keyboard.press("Tab"); // quitte le champ de recherche vers le premier résultat
  await expect(page.getByRole("button", { name: "Olive" }).first()).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.locator("tr", { hasText: "Olive" })).toBeVisible();

  // Le focus doit rester visible (voir :focus-visible dans theme.css) et
  // le champ de masse doit être directement modifiable au clavier.
  const massInput = page.locator("tr", { hasText: "Olive" }).locator("input.mass-input");
  await massInput.focus();
  await page.keyboard.type("100");
  await expect(massInput).toHaveValue("100");
});

test("le surgras et la pureté restent modifiables par tabulation depuis le tableau d'ingrédients", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('input[placeholder="Rechercher une huile ou un beurre…"]').fill("Olive");
  await page.getByRole("button", { name: "Olive" }).first().click();

  await page.locator("tr", { hasText: "Olive" }).locator("input.mass-input").focus();
  await page.keyboard.type("100");

  // Le surgras doit être accessible après le champ de masse dans l'ordre
  // naturel de tabulation (aucun piège de focus).
  await page.locator("#superfat").focus();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("8");
  await expect(page.locator("#superfat")).toHaveValue("8");
});
