import { expect, test } from "@playwright/test";

test("каталог показывает все гипотезы, фильтрует и сбрасывается", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/hypotheses");
  const jump = page.getByRole("navigation", { name: "Разделы мастерской" });
  await expect(jump.getByRole("link", { name: /КАТАЛОГ ГИПОТЕЗ/ })).toHaveAttribute("href", "#hypothesis-list");
  await expect(jump.getByRole("link", { name: /МОИ ЧЕРНОВИКИ/ })).toHaveAttribute("href", "#decision-drafts");
  await expect(jump.getByRole("link", { name: /КАРТА СВЯЗЕЙ/ })).toHaveAttribute("href", "#hypothesis-graph");
  await jump.getByRole("link", { name: /КАТАЛОГ ГИПОТЕЗ/ }).click();
  await expect(page).toHaveURL(/#hypothesis-list$/);
  const catalog = page.locator("#hypothesis-list");
  const all = await catalog.locator(".hypothesis-card").count();
  expect(all).toBeGreaterThanOrEqual(26);
  await expect(catalog.getByRole("status")).toContainText(`ПОКАЗАНО ${all} ИЗ ${all}`);
  await catalog.getByRole("searchbox", { name: "ПОИСК ПО ГИПОТЕЗАМ" }).fill("h-006");
  await expect(catalog.locator(".hypothesis-card")).toHaveCount(1);
  await expect(catalog.locator(".hypothesis-card").first()).toHaveAttribute("href", "/hypotheses/H-006");
  await catalog.getByLabel("СТАТУС РЕЕСТРА").selectOption({ label: "предложена в исходном ТЗ" });
  await expect(catalog.getByText("Ничего не найдено.", { exact: false })).toBeVisible();
  await catalog.getByRole("button", { name: /СБРОСИТЬ ФИЛЬТРЫ/ }).click();
  await expect(catalog.locator(".hypothesis-card")).toHaveCount(all);
  await expect(catalog.getByRole("searchbox", { name: "ПОИСК ПО ГИПОТЕЗАМ" })).toHaveValue("");
  await expect(catalog.getByLabel("СТАТУС РЕЕСТРА")).toHaveValue("");
  await catalog.getByRole("searchbox", { name: "ПОИСК ПО ГИПОТЕЗАМ" }).fill("ЛИМБ");
  await expect(catalog.locator(".hypothesis-card")).not.toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: ".topbar, nextjs-portal { visibility: hidden !important; }" });
  await catalog.screenshot({ path: test.info().outputPath("hypothesis-catalog.png"), animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

