import { describe, expect, it } from "vitest";
import { getStories, parseStories, storiesForEntity, storiesForHypothesis, type StoryReferences } from "../src/lib/stories";
import { getPublicSearchEntries } from "../src/lib/search-index";
import { searchEntries } from "../src/lib/search";

const refs: StoryReferences = { entityIds: new Set(["concept-scrypt-crypt-of-mind"]), eventIds: new Set(["event-test"]), characterIds: new Set(["character-test"]), hypothesisIds: new Set(["H-014", "H-027", "H-028", "H-029"]), conceptHeadings: new Map([["scrypt-zakrytoe-poruchenie", new Set(["Проба сцены / проза", "Проба сцены / вариант с домом", "Пазл A1 / уведомление", "Пазл A2 / коробка", "Пазл A3 / запрос", "Пазл A3 / сценарная форма"])]]) };
describe("истории и сцены", () => {
  it("сохраняет черновик отдельно от лора и разделяет известное и неизвестное", () => {
    const [story] = getStories();
    expect(story.id).toBe("story-scrypt-request");
    expect(storiesForEntity("concept-scrypt-crypt-of-mind", [story])).toEqual([story]);
    expect(storiesForHypothesis("H-027", [story])).toEqual([story]);
    expect(storiesForEntity("character-eleon", [story])).toEqual([]);
    expect(story.scenes[0].id).toBe("scene-scrypt-request-001");
    expect(story.scenes[0].knowledge.every((item) => item.known && item.unknown)).toBe(true);
    expect(story.scenes[1].id).toBe("scene-scrypt-home-variant-002");
    expect(story.scenes[1].hypothesisIds).toContain("H-029");
    expect(story.scenes[1].eventIds).toEqual([]);
    expect(story.scenes[1].knowledge.every((item) => item.known && item.unknown && !item.entityId)).toBe(true);
    expect(storiesForHypothesis("H-029", [story])).toEqual([story]);
    expect(story.scenes.find((scene) => scene.id === "scene-scrypt-puzzle-a3")?.adaptations).toEqual([{ label: "СЦЕНАРНАЯ ФОРМА ТОЙ ЖЕ СЦЕНЫ", sourceHeading: "Пазл A3 / сценарная форма" }]);
    expect(story.scenes[0].chronology).toContain("не определены");
    expect(searchEntries(getPublicSearchEntries(), "scene-scrypt-request-001", "draft").map((x) => x.href)).toContain("/stories/story-scrypt-request");
  });
  it("показывает второй сюжет с условной сценой и раздельными знаниями", () => {
    const story = getStories().find((item) => item.id === "story-dispatch-window")!;
    expect(story).toBeDefined();
    expect(story.hypothesisIds).toEqual(["H-022", "H-023", "H-031", "H-032"]);
    expect(story.entityIds).toEqual([]);
    expect(story.scenes[0].eventIds).toEqual([]);
    expect(story.scenes[0].knowledge).toHaveLength(3);
    expect(story.scenes[0].knowledge.every((item) => item.known && item.unknown && !item.entityId)).toBe(true);
    expect(storiesForHypothesis("H-031", [story])).toEqual([story]);
    expect(searchEntries(getPublicSearchEntries(), "scene-dispatch-reservation-001", "draft").map((entry) => entry.href)).toContain("/stories/story-dispatch-window");
  });
  it("связывает условную пробу Элеоноры с записью и альтернативами без привязки к хронологии", () => {
    const story = getStories().find((item) => item.id === "story-eleonora-before-message")!;
    const scene = story.scenes[0];
    expect(scene.eventIds).toEqual([]);
    expect(scene.knowledge.find((entry) => entry.entityId === "character-eleonora")?.unknown).toContain("не определены");
    expect(storiesForEntity("character-eleonora", [story])).toEqual([story]);
    expect(storiesForHypothesis("H-026", [story])).toEqual([story]);
    expect(searchEntries(getPublicSearchEntries(), scene.id, "draft").map((entry) => entry.href)).toContain("/stories/story-eleonora-before-message");
  });
  it("не скрывает ошибки ID, отсутствующие источники или неопубликованные ссылки", () => {
    const story = getStories()[0];
    expect(() => parseStories([story, story], refs)).toThrow(/Повторный ID истории/);
    expect(() => parseStories([{ ...story, scenes: [story.scenes[0], story.scenes[0]] }], refs)).toThrow(/Повторный ID сцены/);
    expect(() => parseStories([{ ...story, entityIds: ["technology-neural-interface"] }], refs)).toThrow(/непубличный ID записи/);
    expect(() => parseStories([{ ...story, hypothesisIds: ["H-999"] }], refs)).toThrow(/ID гипотезы/);
    expect(() => parseStories([{ ...story, scenes: [{ ...story.scenes[0], eventIds: ["concept-scrypt-crypt-of-mind"] }] }], refs)).toThrow(/ID события/);
    expect(() => parseStories([{ ...story, scenes: [{ ...story.scenes[0], knowledge: [{ ...story.scenes[0].knowledge[0], entityId: "character-missing" }] }] }], refs)).toThrow(/ID персонажа/);
    expect(() => parseStories([{ ...story, conceptSlug: "missing" }], refs)).toThrow(/не найдена публичная концепция/);
    expect(() => parseStories([{ ...story, scenes: [{ ...story.scenes[0], sourceHeading: "нет раздела" }] }], refs)).toThrow(/не найден раздел/);
    expect(() => parseStories([{ ...story, scenes: [{ ...story.scenes[0], adaptations: [{ label: "сценарий", sourceHeading: "нет раздела" }] }] }], refs)).toThrow(/не найден раздел адаптации/);
    expect(() => parseStories([{ ...story, scenes: [{ ...story.scenes[0], adaptations: [{ label: "сценарий", sourceHeading: "Пазл A3 / сценарная форма" }, { label: "сценарий", sourceHeading: "Пазл A3 / сценарная форма" }] }] }], refs)).toThrow(/повторное название адаптации/);
  });
});
