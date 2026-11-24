import { expect, test } from "@playwright/test";

test("главная страница: визуальный эталон и адаптивность", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "АРХОН." })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("home.png", { fullPage: false });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("гипотезы и концепции доступны и не выдаются за канон", async ({ page }) => {
  await page.goto("/hypotheses");
  await expect(page.getByText("ПРЕДЛОЖЕНИЯ, НЕ КАНОН")).toBeVisible();
  await page.getByRole("link", { name: /H-006/ }).click();
  await expect(page.getByRole("heading", { name: "Постепенная автономия вместо мгновенной самодостаточности" })).toBeVisible();
  await expect(page.locator("aside").getByRole("link", { name: /H-005/ })).toBeVisible();
  await page.goto("/concepts");
  await expect(page.getByText("Концепции в разработке")).toBeVisible();
  await expect(page.getByRole("link", { name: /Автоматизированная экономика/ })).toBeVisible();
});

test("карта гипотез различает зависимость и упоминание", async ({ page }) => {
  await page.goto("/hypotheses");
  await expect(page.getByRole("heading", { name: "Связи гипотез" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".hyp-map").screenshot({ path: test.info().outputPath("hypothesis-map.png"), animations: "disabled" });
  await page.getByLabel("ПОИСК ПО ID ИЛИ НАЗВАНИЮ").fill("H-006");
  await page.getByRole("list", { name: "Гипотезы на карте" }).getByRole("button", { name: /H-006/ }).click();
  const detail = page.locator(".hyp-graph-detail");
  await expect(detail.getByRole("listitem").filter({ hasText: "требует эту гипотезу" }).getByRole("link", { name: "H-005 ↗" })).toHaveAttribute("href", "/hypotheses/H-005");
  await expect(detail.getByText("требует эту гипотезу")).toBeVisible();
  await expect(detail.getByText("упомянута в выбранной").first()).toBeVisible();
  await expect(detail.getByRole("link", { name: "ОТКРЫТЬ ГИПОТЕЗУ ↗" })).toHaveAttribute("href", "/hypotheses/H-006");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("двусторонние указатели отделяют гипотезы от записей архива", async ({ page }) => {
  await page.goto("/entity/location-limbo");
  const workshop = page.locator(".entity-workshop");
  await expect(workshop.getByRole("heading", { name: "МАСТЕРСКАЯ / НЕ КАНОН" })).toBeVisible();
  await expect(workshop.getByText(/Идеи для обсуждения/)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await workshop.screenshot({ path: test.info().outputPath("entity-workshop.png"), animations: "disabled" });
  await workshop.getByRole("link", { name: /H-012/ }).click();
  await expect(page.getByRole("heading", { name: "Обитаемый Лимб с заброшенными районами" })).toBeVisible();
  const aside = page.locator(".workshop-aside");
  await expect(aside.getByRole("link", { name: "Лимб ↗" })).toHaveAttribute("href", "/entity/location-limbo");
  await expect(aside.getByText(/не превращает её в факт/)).toBeVisible();
  await aside.getByRole("link", { name: "Лимб ↗" }).click();
  await expect(page.getByRole("heading", { name: "Лимб", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("арт показывает исходный промпт", async ({ page }) => {
  await page.goto("/concept-art");
  await page.getByText("ПРОМПТ ИЗОБРАЖЕНИЯ").first().click();
  await expect(page.getByText(/Wide cinematic 16:9 key art/)).toBeVisible();
  await expect(page.getByRole("button", { name: /КОПИРОВАТЬ ПРОМПТ/ })).toBeVisible();
});

test("граф: поиск, выбор узла и ссылка на запись", async ({ page }) => {
  await page.goto("/connections");
  await expect(page.getByRole("heading", { name: "ГРАФ ВСЕЛЕННОЙ" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.getByLabel("ПОИСК УЗЛА").fill("Элеон");
  await page.locator(".graph-visual").screenshot({ path: test.info().outputPath("graph.png"), animations: "disabled" });
  await page.getByRole("list", { name: "Узлы графа" }).getByRole("button", { name: /^Элеон\s/ }).click();
  await expect(page.getByText("ВЫБРАННАЯ ЗАПИСЬ", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "ОТКРЫТЬ ЗАПИСЬ ↗" })).toHaveAttribute("href", "/entity/character-eleon");
  await page.getByRole("button", { name: "ПОКАЗАТЬ НА КАРТЕ ⌖" }).click();
  await expect(page.getByRole("list", { name: "Узлы графа" }).getByText("Нейроинтерфейс")).toHaveCount(0);
  await page.getByRole("button", { name: "СБРОСИТЬ ВЫБОР" }).click();
  await expect(page.getByText("ВЫБРАННАЯ ЗАПИСЬ", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("неопубликованные сущности и полный реестр недоступны", async ({ page }) => {
  expect((await page.goto("/entity/technology-neural-interface"))?.status()).toBe(404);
  expect((await page.goto("/universe/reestr-suschnostey"))?.status()).toBe(404);
});

test("новые предложения доступны отдельно, а зависимость видна в черновике", async ({ page }) => {
  await page.goto("/hypotheses/H-023");
  await expect(page.getByRole("heading", { name: /Независимая проверка спорного графика/ })).toBeVisible();
  await expect(page.locator(".workshop-notice")).toContainText("предложена");
  const editor = page.locator(".decision-editor");
  await editor.getByLabel("нравится", { exact: true }).check();
  await editor.getByRole("button", { name: "СОХРАНИТЬ ЧЕРНОВИК" }).click();
  await expect(editor.getByText(/H-022.*не оценена/)).toBeVisible();
  await page.goto("/hypotheses/H-022");
  await expect(page.getByRole("heading", { name: /Спор за окно отгрузки/ })).toBeVisible();
  const aside = page.locator(".workshop-aside");
  await expect(aside.getByText("УПОМИНАЕТСЯ В КОНЦЕПЦИЯХ")).toBeVisible();
  await expect(aside.getByText(/не канон/)).toBeVisible();
  await aside.getByRole("link", { name: /Окно отгрузки/ }).click();
  await expect(page.getByRole("heading", { name: /Окно отгрузки — сюжетный набросок/ })).toBeVisible();
});

test("сюжетный набросок доступен как концепция и ведёт к гипотезам", async ({ page }) => {
  await page.goto("/concepts");
  await page.getByRole("link", { name: /Окно отгрузки/ }).click();
  await expect(page.getByRole("heading", { name: "Окно отгрузки — сюжетный набросок" })).toBeVisible();
  await expect(page.locator(".workshop-notice")).toContainText("не утверждённый канон");
  await expect(page.locator("article").getByRole("heading", { name: "Несовместимые варианты исхода" })).toBeVisible();
  await expect(page.locator("article").getByRole("link", { name: "H-022" })).toHaveAttribute("href", "/hypotheses/H-022");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "nextjs-portal { visibility: hidden !important; }" });
  await page.screenshot({ path: test.info().outputPath("concept-page.png") });
});

test("варианты Элеоноры доступны отдельно и связаны с наброском", async ({ page }) => {
  await page.goto("/hypotheses/H-025");
  await expect(page.getByRole("heading", { name: "Элеонора как самостоятельный агент" })).toBeVisible();
  await expect(page.locator(".workshop-notice")).toContainText("не утверждённый канон");
  await expect(page.locator(".workshop-aside").getByRole("link", { name: /Элеонора — голос и границы/ })).toBeVisible();
  await page.locator(".workshop-aside").getByRole("link", { name: /Элеонора — голос и границы/ }).click();
  await expect(page.getByRole("heading", { name: "Элеонора — голос и границы" })).toBeVisible();
  await expect(page.locator("article")).toContainText("несовместимые варианты");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "nextjs-portal { visibility: hidden !important; }" });
  await page.screenshot({ path: test.info().outputPath("eleonora-concept.png") });
});

test("карта показывает несовместимость без направления для обеих альтернатив", async ({ page }) => {
  await page.goto("/hypotheses");
  await expect(page.locator(".hyp-map-legend").getByText("НЕСОВМЕСТИМЫЕ ВАРИАНТЫ")).toBeVisible();
  await expect(page.locator(".hyp-map-canvas canvas").first()).toBeAttached();
  await expect(page.getByRole("checkbox", { name: /НЕСОВМЕСТИМЫЕ ВАРИАНТЫ/ })).toBeChecked();
  const search = page.getByLabel("ПОИСК ПО ID ИЛИ НАЗВАНИЮ");
  for (const [id, other] of [["H-025", "H-026"], ["H-026", "H-025"]]) {
    await search.fill(id);
    const option = page.getByRole("list", { name: "Гипотезы на карте" }).getByRole("button", { name: new RegExp(id) });
    await option.focus();
    await page.keyboard.press("Enter");
    const relation = page.locator(".hyp-graph-detail li").filter({ hasText: "несовместимые варианты при указанных условиях" });
    await expect(relation).toHaveCount(1);
    await expect(relation.getByRole("link", { name: `${other} ↗` })).toHaveAttribute("href", `/hypotheses/${other}`);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("связанный концепт-арт доступен на странице локации и ведёт к промпту", async ({ page }) => {
  await page.goto("/entity/location-limbo");
  const media = page.locator(".entity-media");
  await expect(media.getByRole("heading", { name: "Визуальные исследования" })).toBeVisible();
  await expect(media.getByText(/не утверждённый облик/)).toBeVisible();
  const image = media.getByRole("img", { name: /виртуальная площадь/ });
  await expect(image).toBeVisible();
  expect(await image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: ".topbar, nextjs-portal { visibility: hidden !important; }" });
  await media.screenshot({ path: test.info().outputPath("entity-media.png"), animations: "disabled" });
  await media.getByRole("link", { name: "ПРОИСХОЖДЕНИЕ И ПРОМПТ ↗" }).click();
  await expect(page.locator("#art-002")).toBeVisible();
  await expect(page.locator("#art-002")).toContainText("сгенерировано ИИ");
  await page.locator("#art-002 summary").click();
  await expect(page.locator("#art-002")).toContainText("A single sophisticated science-fiction concept art illustration");
});

test("портрет Харпера обозначен как неканоническое исследование", async ({ page }) => {
  await page.goto("/entity/character-alexei-harper");
  const media = page.locator(".entity-media");
  await expect(media.getByRole("heading", { name: "Алексей Харпер: рабочий портрет" })).toBeVisible();
  await expect(media).toContainText("не установлены и не являются каноном");
  await expect(media.getByRole("img", { name: /Предположительный портрет/ })).toBeVisible();
  await expect(media.getByRole("link", { name: "ПРОИСХОЖДЕНИЕ И ПРОМПТ ↗" })).toHaveAttribute("href", "/concept-art#art-003");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
