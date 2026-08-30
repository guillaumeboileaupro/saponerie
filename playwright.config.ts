import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout de l'interface, exécutés contre le serveur Vite
 * (pas le binaire Tauri compilé : voir tests/e2e/support/mockTauri.ts pour
 * pourquoi et comment l'IPC Tauri est simulé). Couvre les parcours attendus
 * par la revue sécurité/qualité : recette vide, calcul valide/invalide,
 * changement de méthode d'eau, import malformé, sauvegarde/réouverture,
 * duplication, suppression, navigation clavier et responsive.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:1420",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 1420 --strictPort",
    url: "http://localhost:1420",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
