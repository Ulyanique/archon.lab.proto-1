import { describe, expect, it } from "vitest";
import { getHypotheses, getDraftConcepts, conceptsMentioningHypothesis, parseHypotheses, hypothesesForEntity, resolveHypothesisEntities } from "../src/lib/workshop";
import { loadKnowledgeBase } from "@archon/lore-parser";
import { artForEntity, getConceptArt } from "../src/lib/concept-art";
import { buildHypothesisGraph } from "../src/lib/hypothesis-graph";

describe("публичная мастерская", () => {
  it("показывает все гипотезы реестра, включая неопределённые и отклонённые", () => {
    const entries = getHypotheses();
    expect(entries.length).toBeGreaterThanOrEqual(16);
    expect(entries.map((h) => h.id)).toEqual(expect.arrayContaining(["H-001", "H-006", "H-014", "H-015", "H-016", "H-017", "H-018", "H-019", "H-022", "H-023", "H-024", "H-025", "H-026", "H-027", "H-028", "H-029", "H-030", "H-031", "H-032"]));
    expect(entries.find((h) => h.id === "H-006")?.references).toContain("H-005");
    expect(parseHypotheses("## H-999 — Пример\n- **Статус:** не нравится владельцу. **Решение владельца:** нет.\n- **Суть:** Текст.")[0].status).toBe("не нравится владельцу");
  });

  it("не скрывает повреждённые и повторяющиеся идентификаторы", () => {
    expect(() => parseHypotheses("## H-001 — Одно\nТекст\n## H-001 — Другое\nТекст")).toThrow(/повторный/i);
    expect(() => parseHypotheses("## H-1 — Ошибка\nТекст")).toThrow(/Некорректный/);
    expect(() => parseHypotheses("## H-002 без разделителя\nТекст")).toThrow(/Неверный заголовок/);
  });

  it("отличает явную зависимость от упоминания, включая отрицание", () => {
    const entries = getHypotheses();
    const { edges, unresolved } = buildHypothesisGraph(entries);
    expect(entries.find((h) => h.id === "H-006")?.dependencies).toEqual(["H-005"]);
    expect(edges).toContainEqual({ source: "H-006", target: "H-005", kind: "dependency" });
    expect(edges).toContainEqual({ source: "H-023", target: "H-022", kind: "dependency" });
    expect(edges).toContainEqual({ source: "H-023", target: "H-004", kind: "mention" });
    expect(edges).toContainEqual({ source: "H-027", target: "H-014", kind: "dependency" });
    expect(edges).toContainEqual({ source: "H-028", target: "H-027", kind: "dependency" });
    expect(edges).toContainEqual({ source: "H-029", target: "H-027", kind: "dependency" });
    expect(edges).toContainEqual({ source: "H-030", target: "H-028", kind: "dependency" });
    expect(edges).toContainEqual({ source: "H-031", target: "H-022", kind: "dependency" });
    expect(edges).toContainEqual({ source: "H-032", target: "H-022", kind: "dependency" });
    expect(edges.filter((edge) => edge.kind === "conflict")).toEqual([{ source: "H-025", target: "H-026", kind: "conflict" }]);
    expect(edges.some((edge) => edge.source === "H-026" && edge.target === "H-025" && edge.kind === "mention")).toBe(false);
    expect(entries.find((h) => h.id === "H-025")?.dependencies).toEqual([]);
    expect(entries.find((h) => h.id === "H-025")?.conflicts).toEqual(["H-026"]);
    expect(entries.find((h) => h.id === "H-026")?.conflicts).toEqual(["H-025"]);
    expect(() => parseHypotheses("## H-025 — Пример\n- **ID несовместимых гипотез:** H-025")).toThrow(/несовместимые/);
    // «не требует принятия H-001» — упоминание, а не обязательная зависимость.
    expect(edges).toContainEqual({ source: "H-002", target: "H-001", kind: "mention" });
    expect(unresolved).toEqual([]);
    expect(buildHypothesisGraph([{ id: "H-001", title: "", status: "", references: ["H-999"], dependencies: [] }]).unresolved).toEqual([{ source: "H-001", target: "H-999" }]);
    expect(() => parseHypotheses("## H-001 — Пример\n- **ID обязательных зависимостей:** H-001")).toThrow(/зависимости/);
    expect(() => parseHypotheses("## H-001 — Пример\n- **ID обязательных зависимостей:** H-002, H-002")).toThrow(/зависимости/);
  });

  it("связывает мастерскую с опубликованными записями, не раскрывая скрытые через указатель", () => {
    const kb = loadKnowledgeBase();
    const entries = getHypotheses();
    expect(hypothesesForEntity("location-limbo", entries).map((h) => h.id)).toEqual(expect.arrayContaining(["H-008", "H-012", "H-019"]));
    for (const item of entries) expect(resolveHypothesisEntities(item, kb).unavailable, item.id).toBe(0);
    const result = resolveHypothesisEntities({ entityIds: ["character-eleon", "technology-neural-interface", "character-does-not-exist"] }, kb);
    expect(result.entities.map((e) => e.id)).toEqual(["character-eleon"]);
    expect(result.unavailable).toBe(2);
    expect(() => parseHypotheses("## H-001 — Пример\n- **ID записей архива:** bad ID")).toThrow(/ID записей/);
    expect(() => parseHypotheses("## H-001 — Пример\n- **ID записей архива:** character-eleon, character-eleon")).toThrow(/ID записей/);
  });

  it("показывает концепции из публичной папки отдельно от гипотез", () => {
    const drafts = getDraftConcepts();
    expect(drafts.some((c) => c.title.includes("экономика"))).toBe(true);
    expect(drafts.some((c) => c.title.includes("Окно отгрузки"))).toBe(true);
    expect(conceptsMentioningHypothesis("H-028", drafts).map((c) => c.title)).toEqual(["Scrypt — закрытое поручение"]);
    expect(conceptsMentioningHypothesis("H-022", drafts).map((c) => c.title)).toEqual(["Окно отгрузки — сюжетный набросок", "Отгрузка — физика и решения"]);
    expect(conceptsMentioningHypothesis("H-023", drafts).map((c) => c.title)).toEqual(["Окно отгрузки — сюжетный набросок", "Отгрузка — физика и решения"]);
    expect(conceptsMentioningHypothesis("H-032", drafts).map((c) => c.title)).toEqual(["Окно отгрузки — сюжетный набросок", "Отгрузка — физика и решения"]);
    expect(conceptsMentioningHypothesis("H-025", drafts).map((c) => c.title)).toEqual(["Элеонора — голос и границы"]);
    expect(conceptsMentioningHypothesis("H-001", drafts)).toEqual([]);
    expect(drafts.every((c) => !c.doc.path.endsWith("Гипотезы развития мира.md"))).toBe(true);
  });

  it("каждая работа имеет уникальный ID, изображение и промпт", () => {
    const entries = getConceptArt();
    expect(entries.length).toBeGreaterThan(0);
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
    expect(entries.every((entry) => entry.image.startsWith("/images/") && entry.prompt.length > 0)).toBe(true);
    expect(artForEntity("location-limbo").map((item) => item.id)).toContain("art-002");
    expect(artForEntity("character-alexei-harper").map((item) => item.id)).toEqual(["art-003"]);
    expect(artForEntity("character-eleonora")).toEqual([]);
    const kb = loadKnowledgeBase();
    for (const item of entries) for (const id of item.related) expect(resolveHypothesisEntities({ entityIds: [id] }, kb).unavailable, `${item.id}: ${id}`).toBe(0);
  });
});
