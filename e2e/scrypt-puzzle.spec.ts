import { expect, test } from "@playwright/test";

test("прозаические фрагменты и сценарная форма доступны из карточки истории", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text()); });
  await page.goto("/stories/story-scrypt-request");
  const first = page.locator("#scene-scrypt-puzzle-a1");
  const second = page.locator("#scene-scrypt-puzzle-a2");
  const third = page.locator("#scene-scrypt-puzzle-a3");
  await expect(first).toContainText("Первый фрагмент предложенной сборки");
  await expect(second).toContainText("После A1");
  await expect(third).toContainText("не дополнительное событие");
  await expect(third).toContainText("Не знает, существует ли запись");
  await first.getByRole("link", { name: "ЧИТАТЬ ПРОБУ В ИСТОЧНИКЕ ↗" }).click();
  await expect(page.getByRole("heading", { name: "Пазл A1 / уведомление" })).toBeVisible();
  await expect(page.locator(".prose")).toContainText("Илья нашёл уведомление под дверью");
  await expect(page.locator(".prose")).toContainText("Пазл A2 / коробка");
  await page.goto("/stories/story-scrypt-request#scene-scrypt-puzzle-a3");
  await page.locator("#scene-scrypt-puzzle-a3").getByRole("link", { name: "СЦЕНАРНАЯ ФОРМА ТОЙ ЖЕ СЦЕНЫ ↗" }).click();
  await expect(page.getByRole("heading", { name: "Пазл A3 / сценарная форма" })).toBeVisible();
  await expect(page.locator(".prose")).toContainText("ИНТ. ПРИЁМНАЯ");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
