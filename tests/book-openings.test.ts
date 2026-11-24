import { describe, expect, it } from "vitest";
import { getBookOpenings } from "../src/lib/book";
import { parseArrangement } from "../src/lib/book-assembly";
import { searchEntries } from "../src/lib/search";
import { getPublicSearchEntries } from "../src/lib/search-index";

describe("альтернативные начала", () => {
  it("содержит три отдельных полноценных черновика и доступны через поиск", () => {
    const openings = getBookOpenings();
    expect(openings.map((opening) => opening.id)).toEqual(["book-opening-lift", "book-opening-minutes", "book-opening-river"]);
    for (const opening of openings) {
      expect(opening.doc.body.split(/\s+/).length).toBeGreaterThan(250);
      expect(searchEntries(getPublicSearchEntries(), opening.id, "draft").map((entry) => entry.href)).toContain(`/book/openings#${opening.id}`);
    }
  });
  it("не включает новые варианты в ранее сохранённую сборку", () => {
    const old = JSON.stringify({ version: 1, order: ["original"], included: ["original"] });
    const pieces = [{ id: "original", includedByDefault: true }, ...getBookOpenings().map((x) => ({ id: x.id, includedByDefault: false }))];
    const result = parseArrangement(old, pieces);
    expect(result.included).toEqual(["original"]);
    expect(result.order).toEqual(["original", "book-opening-lift", "book-opening-minutes", "book-opening-river"]);
  });
});
