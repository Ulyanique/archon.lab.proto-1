import { expect, test } from "@playwright/test";

test("порядок и начало меняются локально без потери исходника", async ({ page, context }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text()); });
  await page.goto("/book");
  await page.evaluate(() => localStorage.removeItem("archon-book-assembly-v1"));
  await page.reload();
  const chapter = page.locator("#chapter-01");
  await expect(chapter.locator(".assembled-piece").first()).toHaveAttribute("id", "book-piece-missing-minutes");
  await page.getByRole("button", { name: "Сделать началом: Карточка у Нины" }).click();
  await expect(chapter.locator(".assembled-piece").first()).toHaveAttribute("id", "book-piece-nina");
  await expect(page.getByRole("status")).toContainText("сохранена в этом браузере");
  await page.reload();
  await expect(chapter.locator(".assembled-piece").first()).toHaveAttribute("id", "book-piece-nina");
  await page.getByRole("button", { name: "Сделать началом: Дневник: Две минуты" }).click();
  await expect(chapter.locator(".assembled-piece").first()).toHaveAttribute("id", "diary-harper-record-003");
  await expect(chapter.locator(".assembled-piece").first()).toContainText("В рабочем журнале сегодня не хватает двух минут");
  const other = await context.newPage();
  await other.goto("/book");
  await expect(other.locator("#chapter-01 .assembled-piece").first()).toHaveAttribute("id", "diary-harper-record-003");
  await other.getByRole("button", { name: "Сделать началом: Отложено" }).click();
  await expect(chapter.locator(".assembled-piece").first()).toHaveAttribute("id", "book-piece-deferred");
  await other.close();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "ВОССТАНОВИТЬ ИСХОДНУЮ СБОРКУ" }).click();
  await expect(chapter.locator(".assembled-piece").first()).toHaveAttribute("id", "book-piece-missing-minutes");
  await expect(chapter.locator(".assembled-piece")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("повреждённая сборка не перезаписывается без сброса", async ({ page }) => {
  await page.goto("/book");
  await page.evaluate(() => localStorage.setItem("archon-book-assembly-v1", "invalid"));
  await page.reload();
  await expect(page.locator(".book-assembly").getByRole("alert")).toContainText("не перезаписана");
  await expect(page.getByRole("button", { name: "Сделать началом: Карточка у Нины" })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem("archon-book-assembly-v1"))).toBe("invalid");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "ВОССТАНОВИТЬ ИСХОДНУЮ СБОРКУ" }).click();
  await expect(page.locator(".book-assembly").getByRole("alert")).toHaveCount(0);
});
