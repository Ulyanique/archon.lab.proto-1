import { expect, test } from "@playwright/test";

test("поиск отдельно показывает архив, гипотезы, концепции и арт", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: "Записи архива" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Гипотезы" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Рабочие концепции" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Концепт-арт" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  // Значок диагностики Next есть только в dev и не относится к интерфейсу продукта.
  await page.addStyleTag({ content: "nextjs-portal { visibility: hidden !important; }" });
  await expect(page).toHaveScreenshot("search.png", { fullPage: false });
  const input = page.getByRole("searchbox", { name: "ПОИСК ПО АРХИВУ" });
  await input.fill("H-006");
  const card = page.locator(".search-result").filter({ hasText: "Постепенная автономия" });
  await expect(card).toHaveAttribute("href", "/hypotheses/H-006");
  await expect(card.getByText("Гипотеза / не канон")).toBeVisible();
  await page.getByLabel("ИСТОЧНИК").selectOption("draft");
  await input.fill("гигафабрик");
  await expect(page.locator(".search-result").filter({ hasText: "Автоматизированная экономика" })).toBeVisible();
  await page.getByLabel("ИСТОЧНИК").selectOption("art");
  await input.fill("wide cinematic");
  await expect(page.locator(".search-result").first()).toHaveAttribute("href", "/concept-art#art-001");
  await page.getByRole("button", { name: "СБРОСИТЬ ФИЛЬТРЫ ×" }).click();
  await page.getByLabel("ИСТОЧНИК").selectOption("archive");
  await input.fill("манипулятивным");
  const article = page.locator(".search-result").filter({ hasText: "Элеон" });
  await expect(article).toHaveAttribute("href", "/entity/character-eleon");
  await expect(article.locator(".search-result-snippet")).toContainText("манипулятивным");
  await page.addStyleTag({ content: ".topbar { visibility: hidden !important; }" });
  await expect(article).toHaveScreenshot("article-result.png");
  await input.fill("");
  await page.getByLabel("ТИП ЗАПИСИ").selectOption("character");
  await expect(page.locator(".search-result").filter({ hasText: "Элеон" }).first()).toBeVisible();
  await input.fill("технология не существует");
  await expect(page.getByText("Ничего не найдено.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
