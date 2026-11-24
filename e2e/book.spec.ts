import { expect, test } from "@playwright/test";

test("книга открывается из студии и читается целиком", async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text()); });
  await page.goto("/studio");
  await page.getByRole("link", { name: /Книга Архона/ }).click();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole("heading", { name: "Книга Архона." })).toBeVisible();
  await expect(page.getByText("РАБОЧИЙ ТЕКСТ / НЕ КАНОН")).toBeVisible();
  const chapter = page.locator("#chapter-01");
  await expect(chapter.getByRole("heading", { name: "Две минуты", exact: true })).toBeVisible();
  await expect(chapter).toContainText("Кофе уже остыл, когда Харпер заметил");
  await expect(chapter).toContainText("Кофе окончательно остыл. Он выпил его всё равно.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: ".topbar, nextjs-portal { visibility: hidden !important; }" });
  await page.screenshot({ path: info.outputPath("book.png"), animations: "disabled" });
  await page.getByRole("link", { name: "ЧИТАТЬ ДНЕВНИК ↗" }).click();
  await expect(page).toHaveURL(/\/diaries#diary-harper-record-003$/);
  await page.goto("/search");
  await page.getByLabel("ИСТОЧНИК").selectOption("draft");
  await page.getByRole("searchbox", { name: "ПОИСК ПО АРХИВУ" }).fill("book-archon-chapter-01");
  await expect(page.locator('.search-result[href="/book#chapter-01"]')).toBeVisible();
  expect(errors).toEqual([]);
});
