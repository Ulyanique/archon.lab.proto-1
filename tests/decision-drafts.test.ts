import { describe, expect, it } from "vitest";
import { dependencyWarnings, conflictWarnings, formatDecisionDrafts, parseDecisionDrafts, serializeDecisionDrafts, type DecisionDrafts, type DecisionNode } from "../src/lib/decision-drafts";

const nodes: DecisionNode[] = [
  { id: "H-005", title: "Ресурсы", status: "предложена", dependencies: [] },
  { id: "H-006", title: "Автономия", status: "предложена", dependencies: ["H-005"] },
];

describe("личные черновики решений", () => {
  it("сохраняет формат и стабильные ID без превращения в статус реестра", () => {
    const drafts: DecisionDrafts = { "H-006": { choice: "liked", note: "при условии\nуточнить" }, "H-005": { choice: "disliked", note: "" } };
    expect(parseDecisionDrafts(serializeDecisionDrafts(drafts))).toEqual(drafts);
    expect(formatDecisionDrafts(drafts)).toBe("H-005 не нравится\nH-006 нравится: при условии / уточнить");
    expect(parseDecisionDrafts(null)).toEqual({});
  });
  it("не затирает повреждённый или будущий формат", () => {
    for (const raw of ["no json", '{"version":2,"decisions":{}}', '{"version":1,"decisions":{"H-005":{"choice":"approved","note":""}}}', '{"version":1,"decisions":{"broken":{"choice":"liked","note":""}}}']) {
      expect(() => parseDecisionDrafts(raw)).toThrow();
    }
  });
  it("отмечает неоценённые, отклонённые и требующие доработки зависимости", () => {
    expect(dependencyWarnings({ "H-006": { choice: "liked", note: "" } }, nodes).join(" ")).toMatch(/H-005.*не оценена/);
    expect(dependencyWarnings({ "H-006": { choice: "liked", note: "" }, "H-005": { choice: "disliked", note: "" } }, nodes).join(" ")).toMatch(/H-005.*не нравится/);
    expect(dependencyWarnings({ "H-006": { choice: "liked", note: "" }, "H-005": { choice: "revise", note: "" } }, nodes).join(" ")).toMatch(/H-005.*доработать/);
    expect(dependencyWarnings({ "H-006": { choice: "liked", note: "" }, "H-005": { choice: "liked", note: "" } }, nodes)).toEqual([]);
    expect(dependencyWarnings({ "H-006": { choice: "disliked", note: "" } }, nodes)).toEqual([]);
  });
  it("не скрывает уже отклонённую зависимость в реестре даже при положительном черновике", () => {
    const rejected = [{ ...nodes[0], status: "не нравится владельцу" }, nodes[1]];
    const drafts: DecisionDrafts = { "H-005": { choice: "liked", note: "" }, "H-006": { choice: "liked", note: "" } };
    expect(dependencyWarnings(drafts, rejected).join(" ")).toContain("отклонена в реестре");
  });
  it("предупреждает об явно несовместимых положительных оценках один раз и не считает упоминание конфликтом", () => {
    const variants: DecisionNode[] = [
      { id: "H-025", title: "Агент", status: "предложена", dependencies: [], conflicts: ["H-026"] },
      { id: "H-026", title: "Интерфейс", status: "предложена", dependencies: [], conflicts: ["H-025"] },
      { id: "H-027", title: "Упоминание", status: "предложена", dependencies: [] },
    ];
    const both: DecisionDrafts = { "H-025": { choice: "liked", note: "в разное время?" }, "H-026": { choice: "liked", note: "" }, "H-027": { choice: "liked", note: "" } };
    expect(conflictWarnings(both, variants)).toEqual([{ ids: ["H-025", "H-026"], message: expect.stringContaining("несовместимые") }]);
    expect(conflictWarnings({ ...both, "H-026": { choice: "revise", note: "" } }, variants)).toEqual([]);
    expect(conflictWarnings({ "H-025": both["H-025"] }, variants)).toEqual([]);
  });

});
