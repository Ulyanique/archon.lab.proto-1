import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StoryReview } from "../src/components/StoryReview";
import type { StoryReview as Review } from "../src/lib/story-continuity";

describe("подача сигналов проверки", () => {
  it("не называет совместное указание автоматическим противоречием или решением", () => {
    const review: Review = { references: [], signals: [{ kind: "conflict", ids: ["H-025", "H-026"] }, { kind: "missing-dependency", hypothesisId: "H-028", dependencyId: "H-027" }] };
    const html = renderToStaticMarkup(<StoryReview storyId="story-test" review={review} />);
    expect(html).toContain("ПРОВЕРИТЬ УСЛОВИЯ");
    expect(html).toContain("альтернативы или разные периоды");
    expect(html).toContain("не указана в истории или её сценах");
    expect(html).toContain('href="/hypotheses/H-025"');
    expect(html).toContain('href="/hypotheses/H-027"');
    expect(html).not.toContain("Согласовано");
  });
});
