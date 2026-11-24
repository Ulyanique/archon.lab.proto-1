import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const pkg = (name: string) => fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@archon/lore-schema": pkg("lore-schema"),
      "@archon/lore-parser": pkg("lore-parser"),
      "@archon/lore-validator": pkg("lore-validator"),
      "@archon/lore-indexer": pkg("lore-indexer"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
