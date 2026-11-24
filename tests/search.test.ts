import { describe, expect, it } from "vitest";
import { getPublicSearchEntries } from "../src/lib/search-index";
import { searchEntries, searchSnippet, normalizeSearch, type SearchEntry } from "../src/lib/search";
import { visibleTextFromHtml } from "../src/lib/visible-text";
import { renderDocument } from "../src/lib/markdown";
import { getKb } from "../src/lib/lore";

const entries: SearchEntry[] = [
  { id: "H-006", title: "Автономия", href: "/hypotheses/H-006", scope: "hypothesis", label: "гипотеза", status: "предложена", summary: "Ресурсы Элеона", terms: ["Постепенный ремонт"] },
  { id: "H-005", title: "Ресурсы", href: "/hypotheses/H-005", scope: "hypothesis", label: "гипотеза", status: "предложена", summary: "", terms: ["Упоминает H-006"] },
  { id: "character-eleon", title: "Элеон", href: "/entity/character-eleon", scope: "archive", label: "персонаж", status: "review", summary: "ИИ", terms: ["Архон"], entityType: "character", entityStatus: "review" },
];

describe("единый публичный поиск", () => {
  it("учитывает регистр и ё, все слова и точный ID", () => {
    expect(normalizeSearch(" ЭЛЕОН ")).toBe("элеон");
    expect(searchEntries(entries, "элеона ремонт").map((e) => e.id)).toEqual(["H-006"]);
    expect(searchEntries(entries, "h-006").map((e) => e.id)).toEqual(["H-006", "H-005"]);
    expect(searchEntries(entries, "элеон неизвестно")).toEqual([]);
  });
  it("находит содержимое статьи и показывает ограниченный фрагмент", () => {
    const archive = getPublicSearchEntries();
    const match = searchEntries(archive, "манипулятивным", "archive").find((item) => item.id === "character-eleon");
    expect(match).toBeDefined();
    expect(match?.summary.toLowerCase()).not.toContain("манипулятивным");
    expect(searchSnippet(match?.body, "МАНИПУЛЯТИВНЫМ")).toContain("манипулятивным");
    expect(searchSnippet("Ёлка и снег", "елка")).toContain("Ёлка");
    expect(searchSnippet("А Б В", "нет")).toBeNull();
    expect(searchSnippet("А Б В", " ")).toBeNull();
  });
  it("индексирует видимый текст, а не ссылки, скрипты или скрытые атрибуты", () => {
    const kb = getKb();
    const doc = kb.byId.get("character-eleon")!.doc;
    const text = visibleTextFromHtml(renderDocument(kb, { ...doc, body: "# Заголовок\n\nНачало **жирное** окончание. [[Нейроинтерфейс|видимая метка]] [ссылка](https://example.com/secret-path) <script>secret-script</script>\n\nСледующая строка &amp; результат." }));
    expect(text).toContain("Начало жирное окончание");
    expect(text).toContain("видимая метка");
    expect(text).toContain("строка & результат");
    expect(text).not.toContain("secret-path");
    expect(text).not.toContain("secret-script");
    expect(text).not.toContain("Нейроинтерфейс");
  });
  it("применяет фильтры источника, типа и статуса", () => {
    expect(searchEntries(entries, "", "archive", "character", "review").map((e) => e.id)).toEqual(["character-eleon"]);
    expect(searchEntries(entries, "", "hypothesis").map((e) => e.id)).toHaveLength(2);
    expect(searchEntries(entries, "", "archive", "location")).toEqual([]);
  });
  it("индексирует опубликованные записи и только публичные материалы мастерской", () => {
    const all = getPublicSearchEntries();
    expect(all.some((e) => e.id === "technology-neural-interface" && e.scope === "archive")).toBe(false);
    expect(all.some((e) => e.id === "H-006" && e.href === "/hypotheses/H-006")).toBe(true);
    expect(all.some((e) => e.scope === "draft" && e.title.includes("экономика"))).toBe(true);
    expect(searchEntries(all, "представитель ремонта", "draft").some((e) => e.title.includes("Окно отгрузки"))).toBe(true);
    expect(all.some((e) => e.scope === "art" && e.href === "/concept-art#art-001")).toBe(true);
    expect(all.filter((e) => e.scope !== "archive").every((e) => e.label.includes("не канон"))).toBe(true);
    expect(searchEntries(all, "wide cinematic", "art").some((e) => e.id === "art-001")).toBe(true);
  });
});
