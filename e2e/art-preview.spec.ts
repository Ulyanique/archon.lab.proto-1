import { expect, test } from "@playwright/test";

test("крупный просмотр сохраняет контекст, права и клавиатурный фокус", async ({ page }) => {
  await page.goto("/entity/character-alexei-harper");
  const trigger = page.getByRole("button", { name: "Увеличить изображение: Алексей Харпер: рабочий портрет" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Алексей Харпер: рабочий портрет" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Закрыть просмотр изображения" })).toBeFocused();
  await expect(dialog).toContainText("НЕ КАНОН");
  await expect(dialog).toContainText("сгенерировано ИИ");
  await expect(dialog).toContainText("условия использования и лицензирование требуют проверки");
  await expect(dialog.getByRole("img")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "ПРОИСХОЖДЕНИЕ И ПРОМПТ ↗" })).toHaveAttribute("href", "/concept-art#art-003");
  await expect(dialog.getByRole("link", { name: "ОТКРЫТЬ ОРИГИНАЛ ↗" })).toHaveAttribute("href", "/images/harper-study.webp");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dialog.screenshot({ path: test.info().outputPath("art-preview.png"), animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("button", { name: "Закрыть просмотр изображения" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("просмотр работает на странице локации и в каталоге", async ({ page }) => {
  await page.goto("/entity/location-limbo");
  await page.getByRole("button", { name: /Увеличить изображение: Лимб/ }).click();
  const dialog = page.getByRole("dialog", { name: /Лимб: населённый район/ });
  await expect(dialog).toContainText("не устанавливает внешний вид");
  await dialog.getByRole("link", { name: "ПРОИСХОЖДЕНИЕ И ПРОМПТ ↗" }).click();
  await expect(page).toHaveURL(/\/concept-art#art-002$/);
  const card = page.locator("#art-002");
  await card.getByRole("button", { name: /Увеличить изображение: Лимб/ }).click();
  await expect(page.getByRole("dialog", { name: /Лимб: населённый район/ })).toBeVisible();
  await page.getByRole("button", { name: "Закрыть просмотр изображения" }).click();
  await card.locator("summary").click();
  await expect(card).toContainText("A single sophisticated science-fiction concept art illustration");
});
