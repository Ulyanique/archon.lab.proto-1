import { describe, expect, it } from "vitest";
import { isPublishedStatus } from "@archon/lore-schema";
import { loadKnowledgeBase } from "@archon/lore-parser";
import { WORLD_DOMAINS } from "../src/lib/studio";
import { getDraftConcepts, getHypotheses } from "../src/lib/workshop";

describe("рабочая карта мира", () => {
  it("ссылается только на реальные опубликованные записи и существующие гипотезы", () => {
    const kb = loadKnowledgeBase();
    const hypotheses = new Set(getHypotheses().map((item) => item.id));
    expect(new Set(WORLD_DOMAINS.map((domain) => domain.id)).size).toBe(WORLD_DOMAINS.length);
    for (const domain of WORLD_DOMAINS) {
      for (const id of domain.entityIds) expect(isPublishedStatus(kb.byId.get(id)!.fm.status), `${domain.id}: ${id}`).toBe(true);
      for (const id of domain.hypothesisIds) expect(hypotheses.has(id), `${domain.id}: ${id}`).toBe(true);
    }
  });
  it("связывает пример истории с идеями и открытым исходом", () => {
    const story = getDraftConcepts().find((item) => item.title === "Scrypt — закрытое поручение")!;
    expect(story.hypothesisIds).toEqual(["H-014", "H-027", "H-028", "H-029", "H-030"]);
    expect(story.doc.body).toContain("исход не выбран");
    expect(story.doc.body).toContain("художественный эксперимент");
  });
});
