import { describe, expect, it } from "vitest";
import { parseDocument, splitFrontmatter } from "@archon/lore-parser";

describe("lore-parser: parseDocument", () => {
  it("разбирает frontmatter, заголовки и разделы", () => {
    const doc = parseDocument("universe/01-cosmology/Тест.md", "---\nid: concept-test\ntitle: Тест\n---\n\n# Тест\n\n## Источники\n\n- а\n\n## Другое\n\nтекст\n");
    expect(doc.hasFrontmatter).toBe(true);
    expect(doc.yamlErrors).toEqual([]);
    expect(doc.frontmatter).toMatchObject({ id: "concept-test" });
    expect(doc.folder).toBe("01-cosmology");
    expect(doc.fileName).toBe("Тест");
    expect(doc.sections["Источники"]).toBe("- а");
    expect(doc.sections["Другое"]).toBe("текст");
  });

  it("сообщает о невалидном YAML", () => {
    const doc = parseDocument("universe/x/А.md", "---\nid: [unclosed\n---\ntext");
    expect(doc.yamlErrors.length).toBeGreaterThan(0);
  });

  it("сообщает о незакрытом frontmatter", () => {
    const doc = parseDocument("universe/x/А.md", "---\nid: a\nтекст без закрытия");
    expect(doc.yamlErrors[0]).toMatch(/не закрыт/);
  });

  it("документ без frontmatter — hasFrontmatter=false", () => {
    expect(splitFrontmatter("# Просто текст").has).toBe(false);
  });

  it("извлекает вики-ссылки с алиасом, якорем и вложением", () => {
    const doc = parseDocument("universe/x/А.md", "[[Элеон]] [[Элеон|он]] [[Нейрис#История]] ![[map.png]]");
    const links = doc.links.map((l) => [l.target, l.alias, l.heading, l.embed]);
    expect(links).toEqual([
      ["Элеон", undefined, undefined, false],
      ["Элеон", "он", undefined, false],
      ["Нейрис", undefined, "История", false],
      ["map.png", undefined, undefined, true],
    ]);
  });

  it("не учитывает ссылки внутри кода и внешние URL", () => {
    const doc = parseDocument(
      "universe/x/А.md",
      "`[[Скрыто]]`\n\n```\n[[Тоже скрыто]]\n```\n\n[внешняя](https://example.com) [файл](../docs/a%20b.md) [якорь](#x)",
    );
    expect(doc.links.map((l) => l.target)).toEqual(["../docs/a%20b.md"]);
  });

  it("нумерует строки ссылок относительно файла", () => {
    const doc = parseDocument("universe/x/А.md", "---\nid: a\n---\n\nстрока\n[[Цель]]\n");
    expect(doc.links[0].line).toBe(6);
  });

  it("нормализует кириллицу в NFC", () => {
    const decomposed = "Краткий.md".normalize("NFD");
    expect(parseDocument(`universe/x/${decomposed}`, "").fileName).toBe("Краткий");
  });
});
