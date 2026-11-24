import { describe, expect, it } from "vitest";
import { defaultArrangement, movePiece, parseArrangement, serializeArrangement, type BookPiece } from "../src/lib/book-assembly";
import { getBookChapter, getBookFragments } from "../src/lib/book";
const pieces: BookPiece[] = [{ id: "a", title: "А", kind: "", html: "", includedByDefault: true }, { id: "b", title: "Б", kind: "", html: "", includedByDefault: true }, { id: "c", title: "В", kind: "", html: "", includedByDefault: false }];
describe("сборка книги", () => {
  it("делит оригинал без потери или дублирования текста", () => {
    const body = getBookChapter().doc.body.replace(/^\s*# .*\n?/, "").trim();
    expect(getBookFragments().map((p) => p.body).join("\n\n")).toBe(body);
  });
  it("переставляет и восстанавливает выбор без изменения исходников", () => {
    const initial = defaultArrangement(pieces);
    expect(initial).toEqual({ order: ["a", "b", "c"], included: ["a", "b"] });
    const changed = movePiece(initial, "c", "first");
    expect(changed.order).toEqual(["c", "a", "b"]);
    expect(initial.order).toEqual(["a", "b", "c"]);
    expect(movePiece(changed, "c", "up")).toBe(changed);
    expect(parseArrangement(serializeArrangement(changed), pieces)).toEqual(changed);
  });
  it("учитывает новые фрагменты, а неизвестные и повреждённые данные не теряет молча", () => {
    const raw = serializeArrangement({ order: ["b", "a"], included: ["a"] });
    expect(parseArrangement(raw, pieces)).toEqual({ order: ["b", "a", "c"], included: ["a"] });
    expect(() => parseArrangement('{"version":1,"order":["gone"],"included":[]}', pieces)).toThrow(/неизвестные/);
    expect(() => parseArrangement('{"version":1,"order":["a","a"],"included":[]}', pieces)).toThrow(/повторные/);
    expect(() => parseArrangement('{"version":2,"order":[],"included":[]}', pieces)).toThrow(/формат/);
    expect(() => parseArrangement("bad", pieces)).toThrow();
  });
});
