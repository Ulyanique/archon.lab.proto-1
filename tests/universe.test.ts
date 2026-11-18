import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractEdges, findRepoRoot, loadKnowledgeBase } from "@archon/lore-parser";
import { summarize, validateKnowledgeBase } from "@archon/lore-validator";
import { REGISTRY_PATH, buildGraph, buildIndex, buildRegistryMarkdown, buildTimeline } from "@archon/lore-indexer";

const root = findRepoRoot();
const kb = loadKnowledgeBase(root);

describe("реальная база знаний universe/", () => {
  it("проходит валидацию без ошибок", () => {
    const errors = validateKnowledgeBase(kb).filter((d) => d.severity === "error");
    expect(errors, errors.map((e) => `${e.code} ${e.path}: ${e.message}`).join("\n")).toEqual([]);
  });

  it("содержит ключевые сущности с ID из ТЗ §9.5 и их алиасы", () => {
    for (const id of [
      "character-alexei-harper",
      "character-eleon",
      "character-eleonora",
      "location-limbo",
      "location-neiris",
      "location-murmansk-bunker",
      "location-first-temple",
      "technology-neural-interface",
    ]) {
      expect(kb.byId.has(id), id).toBe(true);
    }
    expect(kb.byId.get("character-alexei-harper")!.fm.aliases).toEqual(expect.arrayContaining(["Доктор Харпер", "Кассиус"]));
  });

  it("первоисточник ТЗ сохранён в docs/source", () => {
    const path = join(root, "docs/source/ТЗ Archon Universe Platform.md");
    expect(existsSync(path)).toBe(true);
    const text = readFileSync(path, "utf8");
    expect(text).toContain("Не придумывать недостающие биографические факты как установленные.");
    expect(text).toContain("Пока считать концепцию незавершённой.");
  });

  it("миграция не присвоила статус canon автоматически", () => {
    // Перевод в canon — решение владельца (Q-1). Тест фиксирует, что миграция не присвоила canon сама.
    const migrated = kb.entities.filter((e) => e.fm.created === "2026-11-18" && e.fm.status === "canon");
    expect(migrated.map((e) => e.id)).toEqual([]);
  });

  it("граф строится из YAML и Markdown и содержит связи из ТЗ §13", () => {
    const graph = buildGraph(kb);
    const has = (s: string, t: string, type?: string) => graph.edges.some((e) => e.source === s && e.target === t && (!type || e.type === type));
    expect(has("character-alexei-harper", "character-eleon", "creator")).toBe(true);
    expect(has("character-eleon", "location-moon-eleon-infrastructure", "infrastructure")).toBe(true);
    expect(has("location-limbo", "character-eleon")).toBe(true);
    expect(has("location-murmansk-bunker", "concept-scrypt-crypt-of-mind")).toBe(true);
    expect(has("character-eleon", "character-eleonora")).toBe(true);
    expect(graph.nodes).toHaveLength(kb.entities.length);
    expect(extractEdges(kb).length).toBeGreaterThanOrEqual(graph.edges.length);
  });

  it("хронология не придумывает порядок: события без дат попадают в undated", () => {
    const tl = buildTimeline(kb);
    expect(tl.dated).toEqual([]);
    expect(tl.undated.map((e) => e.id)).toEqual(
      expect.arrayContaining(["event-eleon-self-awareness", "event-eleon-leaves-earth", "event-eleon-becomes-mesh"]),
    );
  });

  it("индекс полон, а реестр сущностей актуален и детерминирован", () => {
    expect(buildIndex(kb).count).toBe(kb.entities.length);
    const onDisk = readFileSync(join(root, REGISTRY_PATH), "utf8").replace(/\r\n/g, "\n").trimEnd();
    expect(onDisk).toBe(buildRegistryMarkdown(kb).trimEnd());
    expect(buildRegistryMarkdown(kb)).toBe(buildRegistryMarkdown(kb));
  });

  it("предупреждения валидатора отсутствуют", () => {
    const { warnings } = summarize(validateKnowledgeBase(kb));
    expect(warnings).toBe(0);
  });
});
