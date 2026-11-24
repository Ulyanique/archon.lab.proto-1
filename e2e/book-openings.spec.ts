import { expect, test } from "@playwright/test";

test("три начала доступны для чтения и выбора в сборке без переписывания", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text()); });
  await page.goto("/book");
  await page.evaluate(() => localStorage.removeItem("archon-book-assembly-v1"));
  await page.reload();
  await page.getByRole("link", { name: "СРАВНИТЬ НАЧАЛА ↗" }).click();
  await expect(page).toHaveURL(/\/book\/openings$/);
  await expect(page.getByText("АЛЬТЕРНАТИВЫ / НЕ КАНОН")).toBeVisible();
  await expect(page.locator("#book-opening-lift")).toContainText("Двери лифта закрылись на рукаве девочки");
  await expect(page.locator("#book-opening-minutes")).toContainText("Нина позвонила Харперу с чужого номера");
  await expect(page.locator("#book-opening-river")).toContainText("На рисунке у реки был один берег");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#book-opening-lift").getByRole("link", { name: "ПЕРЕЙТИ К СБОРКЕ ↗" }).click();
  await page.getByRole("button", { name: "Сделать началом: Вариант A. Лифт" }).click();
  await expect(page.locator("#chapter-01 .assembled-piece").first()).toHaveAttribute("id", "book-opening-lift");
  await expect(page.locator("#chapter-01")).toContainText("Кофе уже остыл, когда Харпер заметил");
  await page.reload();
  await expect(page.locator("#chapter-01 .assembled-piece").first()).toHaveAttribute("id", "book-opening-lift");
  await page.goto("/search");
  await page.getByLabel("ИСТОЧНИК").selectOption("draft");
  await page.getByRole("searchbox", { name: "ПОИСК ПО АРХИВУ" }).fill("book-opening-river");
  await expect(page.locator('.search-result[href="/book/openings#book-opening-river"]')).toBeVisible();
  expect(errors).toEqual([]);
});
