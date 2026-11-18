import { describe, expect, it } from "vitest";
import { buildReport, validateKnowledgeBase, type Diagnostic } from "@archon/lore-validator";
import { concept, entity, kbFrom } from "./helpers";

const codes = (d: Diagnostic[], severity?: Diagnostic["severity"]) =>
  d.filter((x) => !severity || x.severity === severity).map((x) => x.code);

const ok = Object.fromEntries([concept("concept-a", "Альфа"), concept("concept-b", "Бета", "related:\n  - concept-a")]);

describe("lore-validator", () => {
  it("корректная база не даёт ошибок", () => {
    expect(codes(validateKnowledgeBase(kbFrom(ok)), "error")).toEqual([]);
  });

  it("ловит дубликаты ID", () => {
    const kb = kbFrom({ ...ok, ...Object.fromEntries([["universe/01-cosmology/Гамма.md", entity({ id: "concept-a", title: "Гамма", type: "concept" })]]) });
    expect(codes(validateKnowledgeBase(kb))).toContain("ID-DUP");
  });

  it("ловит ссылку на несуществующий ID", () => {
    const kb = kbFrom({ ...ok, ...Object.fromEntries([concept("concept-c", "Гамма", "related:\n  - concept-missing")]) });
    expect(codes(validateKnowledgeBase(kb), "error")).toContain("REF-MISSING");
  });

  it("ловит битую вики-ссылку", () => {
    const kb = kbFrom({
      ...ok,
      ...Object.fromEntries([concept("concept-c", "Гамма", "", "См. [[Нет такой]].")]),
    });
    expect(codes(validateKnowledgeBase(kb), "error")).toContain("LINK-WIKI");
  });

  it("ловит одинаковые имена у разных сущностей (дубликаты)", () => {
    const kb = kbFrom({
      ...ok,
      ...Object.fromEntries([["universe/01-cosmology/Дубль.md", entity({ id: "concept-dup", title: "Дубль", type: "concept", extra: "aliases:\n  - Альфа" })]]),
    });
    const c = codes(validateKnowledgeBase(kb), "error");
    expect(c).toContain("NAME-DUP");
  });

  it("ловит неверный тип, статус и пропущенные поля через схему", () => {
    const bad = `---\nid: concept-bad\ntitle: Плохая\ntype: wizard\nstatus: maybe\ncreated: вчера\nupdated: 2026-01-01\n---\n# x\n`;
    const diags = validateKnowledgeBase(kbFrom({ "universe/01-cosmology/Плохая.md": bad }));
    const schema = diags.filter((d) => d.code === "SCHEMA").map((d) => d.message).join("\n");
    expect(schema).toMatch(/type/);
    expect(schema).toMatch(/status/);
    expect(schema).toMatch(/created/);
  });

  it("ловит неизвестные поля frontmatter (опечатки)", () => {
    const kb = kbFrom({ "universe/01-cosmology/А.md": entity({ id: "concept-a", title: "А", extra: "relatd:\n  - x" }) });
    expect(codes(validateKnowledgeBase(kb), "error")).toContain("SCHEMA");
  });

  it("ловит файл без frontmatter и невалидный YAML", () => {
    const kb = kbFrom({
      "universe/01-cosmology/Без.md": "# Без метаданных",
      "universe/01-cosmology/Кривой.md": "---\nid: [oops\n---\n",
    });
    const c = codes(validateKnowledgeBase(kb), "error");
    expect(c).toContain("FM001");
    expect(c).toContain("YAML001");
  });

  it("префикс ID должен соответствовать типу; исключение character-* для ai (C-7)", () => {
    const wrong = kbFrom({ "universe/01-cosmology/А.md": entity({ id: "location-a", title: "А", type: "concept" }) });
    expect(codes(validateKnowledgeBase(wrong), "error")).toContain("ID-PREFIX");
    const ai = kbFrom({ "universe/04-characters/Ии.md": entity({ id: "character-ii", title: "Ии", type: "ai" }) });
    expect(codes(validateKnowledgeBase(ai), "error")).not.toContain("ID-PREFIX");
  });

  it("событие обязано иметь date; non-event не может иметь date", () => {
    const noDate = kbFrom({ "universe/08-events/Е.md": entity({ id: "event-e", title: "Е", type: "event" }) });
    expect(validateKnowledgeBase(noDate).some((d) => d.code === "SCHEMA" && /date/.test(d.message))).toBe(true);
    const extra = kbFrom({ "universe/01-cosmology/К.md": entity({ id: "concept-k", title: "К", extra: "date:\n  precision: unknown" }) });
    expect(codes(validateKnowledgeBase(extra), "error")).toContain("SCHEMA");
  });

  const ev = (id: string, title: string, date: string, extra = "") =>
    [`universe/08-events/${title}.md`, entity({ id, title, type: "event", extra: `date:\n${date}\n${extra}` })] as const;

  it("поддерживает точные, приблизительные, диапазонные и неизвестные даты", () => {
    const kb = kbFrom(
      Object.fromEntries([
        ev("event-a", "А", "  precision: exact\n  calendar: gregorian\n  start: 2040-05-01"),
        ev("event-b", "Б", "  precision: approximate\n  calendar: gregorian\n  start: 2040"),
        ev("event-c", "В", "  precision: range\n  calendar: gregorian\n  start: 2041\n  end: 2045"),
        ev("event-d", "Г", "  precision: unknown"),
      ]),
    );
    expect(codes(validateKnowledgeBase(kb), "error")).toEqual([]);
  });

  it("precision=range требует start и end; unknown не допускает даты", () => {
    const kb = kbFrom(
      Object.fromEntries([
        ev("event-a", "А", "  precision: range\n  start: 2041"),
        ev("event-b", "Б", "  precision: unknown\n  start: 2041"),
      ]),
    );
    expect(codes(validateKnowledgeBase(kb), "error").filter((c) => c === "SCHEMA").length).toBe(2);
  });

  it("ловит неверный формат и порядок дат, нарушение after и циклы", () => {
    const bad = kbFrom(Object.fromEntries([ev("event-a", "А", "  precision: exact\n  calendar: gregorian\n  start: 2040-13-45")]));
    expect(codes(validateKnowledgeBase(bad), "error")).toContain("DATE-FORMAT");

    const reversed = kbFrom(Object.fromEntries([ev("event-a", "А", "  precision: range\n  calendar: gregorian\n  start: 2050\n  end: 2040")]));
    expect(codes(validateKnowledgeBase(reversed), "error")).toContain("DATE-ORDER");

    const order = kbFrom(
      Object.fromEntries([
        ev("event-early", "Раннее", "  precision: exact\n  calendar: gregorian\n  start: 2030-01-01"),
        ev("event-late", "Позднее", "  precision: exact\n  calendar: gregorian\n  start: 2020-01-01", "after:\n  - event-early"),
      ]),
    );
    expect(codes(validateKnowledgeBase(order), "error")).toContain("DATE-ORDER");

    const cycle = kbFrom(
      Object.fromEntries([
        ev("event-x", "Икс", "  precision: unknown", "after:\n  - event-y"),
        ev("event-y", "Игрек", "  precision: unknown", "after:\n  - event-x"),
      ]),
    );
    expect(codes(validateKnowledgeBase(cycle), "error")).toContain("DATE-CYCLE");
  });

  it("проверяет ссылки на файлы в markdown-ссылках", () => {
    const kb = kbFrom({
      "universe/01-cosmology/А.md": entity({ id: "concept-a", title: "А", body: "[нет](Нет%20файла.md) [есть](Б.md)" }),
      "universe/01-cosmology/Б.md": entity({ id: "concept-b", title: "Б" }),
    });
    const files = validateKnowledgeBase(kb).filter((d) => d.code === "LINK-FILE");
    expect(files).toHaveLength(1);
    expect(files[0].message).toMatch(/Нет file|Нет файла/);
  });

  it("предупреждает о статусах: deprecated без замены, canon без источников", () => {
    const dep = kbFrom({ "universe/01-cosmology/А.md": entity({ id: "concept-a", title: "А", status: "deprecated" }) });
    expect(codes(validateKnowledgeBase(dep), "warning")).toContain("STATUS-DEPRECATED");
    const canon = entity({ id: "concept-c", title: "К", status: "canon" }).replace("- тест", "-");
    expect(codes(validateKnowledgeBase(kbFrom({ "universe/01-cosmology/К.md": canon })), "warning")).toContain("STATUS-CANON-SOURCES");
  });

  it("предупреждает о папке, не соответствующей типу, и об отсутствии разделов", () => {
    const kb = kbFrom({ "universe/03-locations/Не там.md": entity({ id: "concept-x", title: "Не там" }).replace(/## Источники[\s\S]*/, "") });
    const c = codes(validateKnowledgeBase(kb), "warning");
    expect(c).toContain("FOLDER-TYPE");
    expect(c).toContain("SECTION-MISSING");
  });

  it("не изменяет входные данные и формирует отчёт о противоречиях", () => {
    const kb = kbFrom({
      "universe/01-cosmology/Альфа.md": entity({ id: "concept-a", title: "Альфа", status: "canon", extra: "related:\n  - concept-b" }),
      "universe/01-cosmology/Бета.md": entity({ id: "concept-b", title: "Бета", status: "unresolved" }),
    });
    const before = JSON.stringify(kb.entities.map((e) => e.fm));
    const report = buildReport(kb, validateKnowledgeBase(kb));
    expect(JSON.stringify(kb.entities.map((e) => e.fm))).toBe(before);
    const dep = report.heuristics.find((h) => h.code === "STATUS-DEPENDENCY")!;
    expect(dep.items.length).toBeGreaterThan(0);
  });
});
