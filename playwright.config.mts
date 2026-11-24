import { defineConfig, devices } from "@playwright/test";
import chromium from "@sparticuz/chromium";
import { chromiumLibraryPath } from "./scripts/chromium-libs.mjs";

const libraryPath = chromiumLibraryPath();
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || await chromium.executablePath();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000, toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.01 } },
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    // В обычном Linux single-process закрывает браузер после первого тестового контекста.
    launchOptions: { executablePath, args: chromium.args.filter((arg) => arg !== "--single-process" && arg !== "--disable-web-security" && arg !== "--allow-running-insecure-content"), env: { ...process.env, ...(libraryPath ? { LD_LIBRARY_PATH: libraryPath } : {}) } },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "npm run build && npm run start -- --hostname 0.0.0.0 --port 3100",
    env: { ARCHON_E2E: "1", DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db" },
    url: "http://127.0.0.1:3100",
    // Не тестировать случайно устаревший или посторонний сервер на том же порту.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
