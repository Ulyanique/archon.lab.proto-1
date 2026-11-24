import { describe, expect, it } from "vitest";
import { filterHypotheses, type HypothesisListItem } from "../src/lib/hypothesis-filter";

const items: HypothesisListItem[] = [
  { id: "H-001", title: "Лунный резерв", summary: "Оговорки Элеона", status: "предложена", referencesCount: 1 },
  { id: "H-002", title: "Обитаемый Лимб", summary: "Обычный VR", status: "доработать", referencesCount: 0 },
];
describe("каталог гипотез", () => {
  it("по умолчанию ничего не скрывает и сохраняет порядок", () => expect(filterHypotheses(items, "", "")).toEqual(items));
  it("ищет все слова по ID, названию и описанию с учётом ё и регистра", () => {
    expect(filterHypotheses(items, "h-001", "")).toEqual([items[0]]);
    expect(filterHypotheses(items, "элЕОНА лунный", "")).toEqual([items[0]]);
    expect(filterHypotheses(items, "лимб несуществующее", "")).toEqual([]);
  });
  it("фильтрует только по статусу реестра, включая будущие статусы", () => {
    expect(filterHypotheses(items, "", "доработать")).toEqual([items[1]]);
    expect(filterHypotheses(items, "лимб", "предложена")).toEqual([]);
  });
});
