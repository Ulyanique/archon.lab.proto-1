import { expect, test } from "@playwright/test";

// Проверка вычисленных стилей ловит разрыв между HTML и устаревшим CSS даже при работающем JS.
test("страницы получают актуальные стили карты и мастерской", async ({ page }, testInfo) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error" && /hydrat/i.test(message.text())) hydrationErrors.push(message.text()); });
  await page.goto("/hypotheses");
  const layout = page.locator(".hyp-graph-layout");
  await expect(layout).toHaveCSS("display", "grid");
  await expect(page.locator(".hyp-map-canvas canvas").first()).toBeAttached();
  await expect(page.locator(".hyp-list")).toHaveCSS("overflow-y", "auto");
  const columns = await layout.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(testInfo.project.name === "mobile" ? 1 : 2);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: ".topbar, nextjs-portal { visibility: hidden !important; }" });
  await expect(layout).toHaveScreenshot("hypothesis-layout.png", { timeout: 20_000, mask: [page.locator(".hyp-map-canvas")] });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(hydrationErrors).toEqual([]);

  await page.goto("/entity/location-limbo");
  await expect(page.locator(".entity-workshop")).toHaveCSS("border-left-width", "2px");
  await page.goto("/connections");
  await expect(page.locator(".graph-layout")).toHaveCSS("display", "grid");
  await expect(page.locator(".graph-visual")).toHaveCSS("position", "relative");
  await page.goto("/concept-art");
  await expect(page.locator(".art-card").first()).toHaveCSS("display", "grid");
});
