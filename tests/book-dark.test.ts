import { describe, expect, it } from "vitest";
import { getDarkOpening } from "../src/lib/book";
import { getKb } from "../src/lib/lore";
import { renderDocument } from "../src/lib/markdown";

describe("начало после аварии", () => {
  it("загружает самостоятельный черновик без дублирующего заголовка", () => {
    const opening = getDarkOpening();
    expect(opening.id).toBe("book-opening-dark");
    expect(opening.doc.body).toContain("Сначала был звук.");
    expect(opening.doc.body).toContain("Алексей Харпер.");
    expect(renderDocument(getKb(), opening.doc)).not.toContain("<h1");
  });
});
