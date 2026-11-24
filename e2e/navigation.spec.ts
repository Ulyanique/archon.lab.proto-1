import { expect, test } from "@playwright/test";

test("разделы сгруппированы, а поиск доступен сразу", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text()); });
  await page.goto("/");
  const search = info.project.name === "mobile" ? page.getByRole("link", { name: "Поиск по архиву" }) : page.getByRole("navigation", { name: "Быстрые разделы" }).getByRole("link", { name: "Поиск", exact: true });
  await expect(search).toBeVisible();
  const toggle = page.getByRole("button", { name: "РАЗДЕЛЫ" });
  await toggle.click();
  const menu = page.getByRole("navigation", { name: "Основная навигация" });
  for (const title of ["ИССЛЕДОВАТЬ МИР", "АРХИВ И СВЯЗИ", "МАСТЕРСКАЯ / НЕ КАНОН"]) await expect(menu.getByRole("heading", { name: title })).toBeVisible();
  await expect(menu.getByRole("link")).toHaveCount(17);
  await expect(menu.getByRole("link", { name: "Дневники Харпера", exact: true })).toHaveAttribute("href", "/diaries");
  await expect(menu.getByRole("link", { name: "Концепции", exact: true })).toHaveAttribute("href", "/concepts");
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "nextjs-portal { visibility: hidden !important; }" });
  await page.screenshot({ path: test.info().outputPath("navigation.png") });
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator(".brand").click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.goto("/diaries");
  await page.getByRole("button", { name: "РАЗДЕЛЫ" }).click();
  await expect(menu.getByRole("link", { name: "Дневники Харпера", exact: true })).toHaveAttribute("aria-current", "page");
  expect(errors).toEqual([]);
});
