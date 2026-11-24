import { describe, expect, it } from "vitest";
import { getBookChapter } from "../src/lib/book";
import { getPublicSearchEntries } from "../src/lib/search-index";
import { searchEntries } from "../src/lib/search";
import { renderDocument } from "../src/lib/markdown";
import { getKb } from "../src/lib/lore";

describe("первый черновик книги", () => {
  it("содержит полную главу как отдельный текст, а не пересказ", () => {
    const chapter = getBookChapter();
    expect(chapter.doc.path).toBe("drafts/works/Архон — глава 1.md");
    expect(chapter.doc.body.split(/\s+/).length).toBeGreaterThan(700);
    expect(chapter.doc.body).toContain("Кофе уже остыл, когда Харпер заметил");
    expect(chapter.doc.body).toContain("Кофе окончательно остыл");
    const html = renderDocument(getKb(), chapter.doc);
    expect(html).not.toContain("<h1");
    expect(html).toContain("Харпер");
    expect(searchEntries(getPublicSearchEntries(), "отложено", "draft").some((e) => e.href === "/book#chapter-01" && e.label.includes("не канон"))).toBe(true);
  });
});
