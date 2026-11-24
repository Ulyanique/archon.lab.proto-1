import { expect, test } from "@playwright/test";

test("студия связывает сферы мира, решения и сюжет без утверждения канона", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text()); });
  await page.goto("/");
  await page.getByRole("link", { name: /СТУДИЯ \/ РАБОТАТЬ НАД МИРОМ/ }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.getByRole("heading", { name: "Студия Архона." })).toBeVisible();
  await expect(page.getByText(/не становятся каноном автоматически/)).toBeVisible();
  await expect(page.getByText(/не автоматическая/)).toHaveCount(0);
  await expect(page.getByText(/не ограничивает доступ к сайту/)).toBeVisible();
  const domains = page.locator(".studio-domain");
  await expect(domains).toHaveCount(7);
  const memory = domains.filter({ has: page.getByRole("heading", { name: "Память и архив" }) });
  await expect(memory.getByRole("link", { name: /H-028/ })).toHaveAttribute("href", "/hypotheses/H-028");
  const decisions = page.locator(".studio-decisions");
  await expect(decisions).toContainText("Требует: H-027");
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: ".topbar, nextjs-portal { visibility: hidden !important; }" });
  await page.screenshot({ path: info.outputPath("studio.png"), fullPage: true, animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "ОТКРЫТЬ РАБОЧИЙ НАБРОСОК ↗" }).click();
  await expect(page.getByRole("heading", { name: "Scrypt — закрытое поручение" })).toBeVisible();
  await expect(page.locator(".prose")).toContainText("художественный эксперимент");
  expect(errors).toEqual([]);
});
