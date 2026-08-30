import { defineConfig } from "vitest/config";

// Les fichiers *.spec.ts sous tests/e2e/ sont des tests Playwright (voir
// playwright.config.ts) : ils utilisent leur propre `test`/`expect` avec
// des fixtures de page réelle, incompatibles avec le runner vitest. Sans
// cette exclusion, vitest les ramasserait aussi via son motif par défaut
// et échouerait dessus.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["tests/**", "node_modules/**"],
  },
});
