import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // La suite comparte una base SQLite (`data/mipyme.db`) entre archivos de test.
    // Ejecutar los archivos en paralelo produce contención de locks de escritura.
    fileParallelism: false,
    setupFiles: ["./src/tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    exclude: ["**/visual-tests/**", "**/tests/*.mjs", "node_modules/**"],
    include: ["src/tests/**/*.test.ts", "src/tests/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
