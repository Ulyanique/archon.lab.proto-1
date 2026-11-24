import { expect, test } from "@playwright/test";

test("путеводитель ведёт к записям и сохраняет справочные материалы", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Исследовать вселенную" }).click();
  await expect(page.getByRole("heading", { name: "Вселенная Архон." })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("не утверждены как канон");
  for (const id of ["concept-archon", "character-eleon", "character-alexei-harper", "location-limbo"]) {
    await expect(page.locator(`.universe-path[href="/entity/${id}"]`)).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".universe-overview").screenshot({ path: test.info().outputPath("universe.png"), animations: "disabled" });
  await page.getByRole("link", { name: "ОТКРЫТЬ СПРАВОЧНЫЕ МАТЕРИАЛЫ ↗" }).click();
  await expect(page.getByRole("heading", { name: "Справочные материалы" })).toBeVisible();
  await expect(page.getByText("Общая идея (ТЗ §2.1)")).toBeVisible();
});

test("профиль Харпера соединяет исследование с историей и связями", async ({ page }) => {
  await page.goto("/entity/character-alexei-harper");
  const profile = page.locator(".entity-profile");
  await expect(profile.getByRole("heading", { name: "Алексей Харпер", exact: true })).toBeVisible();
  await expect(profile.getByRole("img", { name: /Предположительный портрет/ })).toBeVisible();
  await expect(profile).toContainText("не установлены и не являются каноном");
  await expect(profile.getByRole("link", { name: "ПРОИСХОЖДЕНИЕ И ПРОМПТ ↗" })).toHaveAttribute("href", "/concept-art#art-003");
  await expect(page.locator("#entity-story")).toBeVisible();
  await expect(page.locator("#entity-connections")).toBeVisible();
  await profile.getByRole("link", { name: "История ↓" }).click();
  await expect(page).toHaveURL(/#entity-story$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".entity-profile").screenshot({ path: test.info().outputPath("profile.png"), animations: "disabled" });
});
