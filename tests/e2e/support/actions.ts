import type { Page } from "@playwright/test";

const SEARCH_PLACEHOLDER = "Rechercher une huile ou un beurre…";

/** Recherche puis ajoute un corps gras par son nom affiché, et renseigne sa masse. */
export async function addIngredient(page: Page, displayName: string, massGrams: string): Promise<void> {
  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill(displayName);
  await page.getByRole("button", { name: displayName }).first().click();
  await page.locator("tr", { hasText: displayName }).locator("input.mass-input").fill(massGrams);
}
