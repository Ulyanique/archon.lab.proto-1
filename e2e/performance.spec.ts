import { test } from "@playwright/test";

// Лабораторные одноразовые измерения, не полевые Core Web Vitals и не гарантии SLA.
test("диагностика загрузки главной и перехода в архив", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Одна воспроизводимая лабораторная выборка.");
  await page.addInitScript(() => {
    (window as unknown as { labLcp: number }).labLcp = 0;
    try { new PerformanceObserver((list) => { const entries = list.getEntries(); (window as unknown as { labLcp: number }).labLcp = entries[entries.length - 1]?.startTime ?? 0; }).observe({ type: "largest-contentful-paint", buffered: true }); } catch { /* поддержка зависит от браузера */ }
  });
  await page.goto("/", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const cold = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null;
    return { domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd), loadMs: Math.round(nav.loadEventEnd), fcpMs: fcp && Math.round(fcp), lcpMs: Math.round((window as unknown as { labLcp: number }).labLcp), transferredBytes: Math.round(performance.getEntriesByType("resource").reduce((sum, entry) => sum + (entry as PerformanceResourceTiming).transferSize, nav.transferSize)) };
  });
  const start = Date.now();
  await page.getByRole("link", { name: "Исследовать вселенную" }).click();
  await page.getByRole("heading", { name: /Вселенная/i }).first().waitFor();
  console.log("PERF LAB", JSON.stringify({ cold, linkToHeadingMs: Date.now() - start }));
});
