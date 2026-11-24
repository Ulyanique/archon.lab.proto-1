import { expect, test } from "@playwright/test";

const sizes = [
  { name: "узкий телефон", width: 320, height: 640 },
  { name: "телефон", width: 390, height: 844 },
  { name: "телефон горизонтально", width: 844, height: 390 },
  { name: "небольшой планшет", width: 600, height: 960 },
  { name: "планшет", width: 768, height: 1024 },
  { name: "ноутбук", width: 1024, height: 768 },
  { name: "переходная ширина", width: 1090, height: 900 },
  { name: "ноутбук широкий", width: 1280, height: 800 },
  { name: "граница меню", width: 1321, height: 900 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "широкий экран", width: 1920, height: 1080 },
];
const routes = ["/", "/studio", "/studio/continuity", "/book", "/book/openings", "/diaries", "/stories", "/stories/story-scrypt-request", "/hypotheses", "/hypotheses/H-006", "/connections", "/concept-art", "/concepts", "/entity/location-limbo", "/timeline", "/search"];

test("контрольные ширины: страницы и заголовки помещаются в экран", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Матрица размеров выполняется один раз; сенсорное меню проверяется отдельно.");
  test.setTimeout(120_000);
  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main h1").first()).toBeVisible();
      const overflow = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth - innerWidth,
        headings: [...document.querySelectorAll<HTMLElement>("main h1, main h2, main h3")]
          .filter((element) => element.scrollWidth > element.clientWidth + 2 && getComputedStyle(element).overflowX === "visible")
          .map((element) => element.textContent?.trim()),
      }));
      expect(overflow, `${size.name}: ${route}`).toEqual({ page: 0, headings: [] });
    }
  }
});

test("главная на переходной ширине: описание и меню остаются удобными", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Промежуточную ширину проверяем один раз.");
  await page.setViewportSize({ width: 1090, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const description = page.locator(".hero-bottom p");
  await expect(description).toBeVisible();
  expect((await description.boundingBox())?.width).toBeGreaterThanOrEqual(200);
  await expect(page.locator(".hero-bottom")).toHaveCSS("flex-direction", "column");
  await expect(page.locator(".nav-toggle")).toBeVisible();
  await expect(page).toHaveScreenshot("home-intermediate.png", { fullPage: false });
  await page.locator(".nav-toggle").click();
  await expect(page.getByRole("navigation", { name: "Основная навигация" }).getByRole("link", { name: "Поиск", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  for (const width of [1321, 1360, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const nav = page.locator(".nav");
    await expect(nav).toBeVisible();
    const widths = await nav.evaluate((element) => ({ content: element.scrollWidth, visible: element.clientWidth }));
    expect(widths.content, `Обрезанная навигация при ${width}px`).toBeLessThanOrEqual(widths.visible + 1);
  }
});

test("компактное меню открывает все разделы, закрывается и доступно с клавиатуры", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Компактная навигация проверяется в мобильном контексте.");
  await page.goto("/");
  const toggle = page.locator(".nav-toggle");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const menu = page.getByRole("navigation", { name: "Основная навигация" });
  await expect(menu.getByRole("link", { name: "Поиск", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await menu.getByRole("link", { name: "Связи", exact: true }).click();
  await expect(page).toHaveURL(/\/connections$/);
  await expect(page.getByRole("button", { name: "РАЗДЕЛЫ" })).toHaveAttribute("aria-expanded", "false");
});

