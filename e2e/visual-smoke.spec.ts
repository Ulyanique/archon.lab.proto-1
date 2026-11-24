import { expect, test } from "@playwright/test";

const routes = ["/", "/studio", "/studio/continuity", "/stories", "/stories/story-scrypt-request", "/universe", "/universe/reference", "/characters", "/locations", "/technology", "/organizations", "/events", "/archive", "/concepts", "/hypotheses", "/hypotheses/H-006", "/concept-art", "/timeline", "/connections", "/search", "/entity/location-limbo"];

test("основные страницы не теряют стили и не выходят за ширину экрана", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && /\/_next\/static\/.*\.css(?:\?|$)/.test(response.url())) errors.push(`CSS ${response.status()}: ${response.url()}`);
  });
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("main h1").first(), route).toBeVisible();
    expect(await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor), route).not.toBe("rgba(0, 0, 0, 0)");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
  }
  expect(errors).toEqual([]);
});
