import type { Story } from "./stories";

export type ReviewHypothesis = { id: string; title: string; status: string; dependencies: string[]; conflicts?: string[] };
export type ReferenceLocation = { type: "story" | "scene"; id: string; title: string };
export type StoryReviewSignal =
  | { kind: "missing-dependency"; hypothesisId: string; dependencyId: string }
  | { kind: "conflict"; ids: [string, string] };
export type StoryReview = { references: { hypothesis: ReviewHypothesis; locations: ReferenceLocation[] }[]; signals: StoryReviewSignal[] };

/** Механическая проверка явных указателей — не решение о каноне и не анализ текста. */
export function reviewStory(story: Pick<Story, "id" | "title" | "hypothesisIds" | "scenes">, hypotheses: ReviewHypothesis[]): StoryReview {
  const byId = new Map(hypotheses.map((item) => [item.id, item]));
  const locations = new Map<string, ReferenceLocation[]>();
  const add = (id: string, location: ReferenceLocation) => locations.set(id, [...(locations.get(id) ?? []), location]);
  story.hypothesisIds.forEach((id) => add(id, { type: "story", id: story.id, title: story.title }));
  story.scenes.forEach((scene) => scene.hypothesisIds.forEach((id) => add(id, { type: "scene", id: scene.id, title: scene.title })));
  const linked = new Set(locations.keys());
  const references = [...locations].sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([id, places]) => {
    const hypothesis = byId.get(id);
    if (!hypothesis) throw new Error(`Не найдена гипотеза в истории ${story.id}: ${id}`);
    return { hypothesis, locations: places };
  });
  const signals: StoryReviewSignal[] = [];
  const conflicts = new Set<string>();
  for (const { hypothesis } of references) {
    for (const dependencyId of hypothesis.dependencies) {
      if (!byId.has(dependencyId)) throw new Error(`Не найдена зависимость ${hypothesis.id}: ${dependencyId}`);
      if (!linked.has(dependencyId)) signals.push({ kind: "missing-dependency", hypothesisId: hypothesis.id, dependencyId });
    }
    for (const other of hypothesis.conflicts ?? []) {
      if (!byId.has(other)) throw new Error(`Не найдена несовместимая гипотеза ${hypothesis.id}: ${other}`);
      if (!linked.has(other)) continue;
      const ids = [hypothesis.id, other].sort() as [string, string];
      const key = ids.join(":");
      if (!conflicts.has(key)) { conflicts.add(key); signals.push({ kind: "conflict", ids }); }
    }
  }
  return { references, signals };
}
