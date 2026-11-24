import { describe, expect, it } from "vitest";
import { getStories } from "../src/lib/stories";
import { getHypotheses } from "../src/lib/workshop";
import { reviewStory, type ReviewHypothesis } from "../src/lib/story-continuity";

const nodes: ReviewHypothesis[] = [
  { id: "H-001", title: "Основа", status: "предложена", dependencies: [] },
  { id: "H-002", title: "Зависимая", status: "предложена", dependencies: ["H-001"] },
  { id: "H-025", title: "Альтернатива А", status: "предложена", dependencies: [], conflicts: ["H-026"] },
  { id: "H-026", title: "Альтернатива Б", status: "предложена", dependencies: [], conflicts: ["H-025"] },
];
const story = getStories()[0];
describe("проверка связей истории", () => {
  it("показывает происхождение указателей без ложного сигнала для Scrypt", () => {
    const result = reviewStory(story, getHypotheses());
    expect(result.signals).toEqual([]);
    expect(result.references.find((ref) => ref.hypothesis.id === "H-027")?.locations.map((where) => where.type)).toEqual(["story", "scene", "scene", "scene", "scene", "scene"]);
    expect(result.references.find((ref) => ref.hypothesis.id === "H-029")?.locations.map((where) => where.type)).toEqual(["scene", "scene", "scene", "scene"]);
    expect(result.references.find((ref) => ref.hypothesis.id === "H-028")?.locations.map((where) => where.type)).toEqual(["story"]);
  });
  it("проверяет ссылки второй истории, включая зависимость её варианта", () => {
    const second = getStories().find((item) => item.id === "story-dispatch-window")!;
    const result = reviewStory(second, getHypotheses());
    expect(result.signals).toEqual([]);
    expect(result.references.find((ref) => ref.hypothesis.id === "H-031")?.locations.map((item) => item.type)).toEqual(["story", "scene"]);
  });
  it("помечает две альтернативы Элеоноры сигналом, не называя это ошибкой сюжета", () => {
    const eleonora = getStories().find((item) => item.id === "story-eleonora-before-message")!;
    expect(reviewStory(eleonora, getHypotheses()).signals).toEqual([{ kind: "conflict", ids: ["H-025", "H-026"] }]);
  });
  it("показывает отсутствие указателя на зависимость, но учитывает её наличие в сцене", () => {
    const sample = { ...story, hypothesisIds: ["H-002"], scenes: [] };
    expect(reviewStory(sample, nodes).signals).toEqual([{ kind: "missing-dependency", hypothesisId: "H-002", dependencyId: "H-001" }]);
    expect(reviewStory({ ...sample, scenes: [{ ...story.scenes[0], hypothesisIds: ["H-001"] }] }, nodes).signals).toEqual([]);
  });
  it("показывает несовместимые альтернативы один раз, даже если ссылка повторена в сцене", () => {
    const sample = { ...story, hypothesisIds: ["H-025", "H-026"], scenes: [{ ...story.scenes[0], hypothesisIds: ["H-025"] }] };
    expect(reviewStory(sample, nodes).signals).toEqual([{ kind: "conflict", ids: ["H-025", "H-026"] }]);
    expect(reviewStory({ ...sample, hypothesisIds: ["H-025"], scenes: [] }, nodes).signals).toEqual([]);
  });
  it("не создаёт сигналы из свободного текста и не скрывает отсутствующий ID", () => {
    expect(reviewStory({ ...story, hypothesisIds: [], scenes: [] }, nodes)).toEqual({ references: [], signals: [] });
    expect(() => reviewStory({ ...story, hypothesisIds: ["H-999"], scenes: [] }, nodes)).toThrow(/Не найдена гипотеза/);
  });
  it("не зацикливается на циклических зависимостях и сообщает отсутствующую прямую связь", () => {
    const cycle = [{ id: "H-001", title: "A", status: "", dependencies: ["H-002"] }, { id: "H-002", title: "B", status: "", dependencies: ["H-001"] }];
    expect(reviewStory({ ...story, hypothesisIds: ["H-001"], scenes: [] }, cycle).signals).toEqual([{ kind: "missing-dependency", hypothesisId: "H-001", dependencyId: "H-002" }]);
  });
});
