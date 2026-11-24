import { defineConfig } from "@playwright/test";
import base from "./playwright.config.mjs";

// Независимый smoke-test живого dev-сервера; нельзя подменять production-сборкой.
export default defineConfig(base, {
  testMatch: ["layout.spec.ts", "search.spec.ts", "decisions.spec.ts", "archive.spec.ts", "navigation.spec.ts", "hypothesis-catalog.spec.ts", "universe-profile.spec.ts", "hypothesis-network.spec.ts", "art-preview.spec.ts", "scrypt-workshop.spec.ts", "studio.spec.ts", "stories.spec.ts", "continuity.spec.ts", "dispatch-story.spec.ts", "eleonora-story.spec.ts", "scrypt-puzzle.spec.ts", "diaries.spec.ts", "book.spec.ts", "book-assembly.spec.ts", "book-openings.spec.ts"],
  use: { ...base.use, baseURL: "http://127.0.0.1:3200" },
  webServer: {
    command: "npm run dev -- --hostname 0.0.0.0 --port 3200",
    env: { ARCHON_E2E: "1" },
    url: "http://127.0.0.1:3200",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
