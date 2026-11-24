import { describe, expect, it } from "vitest";
import { diariesForEntity, diariesForStory, getDiaries, parseDiaries, type DiaryReferences } from "../src/lib/diaries";
import { getPublicSearchEntries } from "../src/lib/search-index";
import { searchEntries } from "../src/lib/search";

const refs: DiaryReferences = { entityIds: new Set(["character-alexei-harper", "character-eleonora", "character-eleon"]), hypothesisIds: new Set(["H-008", "H-010", "H-024"]), storyIds: new Set(["story-eleonora-before-message"]) };
describe("дневники Харпера", () => {
  const entries = getDiaries();
  it("сохраняет разные носители, голос и тематические связи без дат", () => {
    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.medium)).toEqual(["paper", "digital", "digital"]);
    expect(entries.every((e) => e.timeNote.includes("не определен"))).toBe(true);
    expect(diariesForEntity("character-alexei-harper", entries)).toHaveLength(3);
    expect(diariesForStory("story-eleonora-before-message", entries).map((e) => e.id)).toEqual(["diary-harper-school-002"]);
    expect(entries[1].paragraphs.join(" ")).toContain("Элеоноре");
    expect(searchEntries(getPublicSearchEntries(), "диагностика-несуществующая", "draft")).toEqual([]);
    expect(searchEntries(getPublicSearchEntries(), "diary-harper-coffee-001", "draft").map((x) => x.href)).toContain("/diaries#diary-harper-coffee-001");
    expect(searchEntries(getPublicSearchEntries(), "проверка завершена", "draft").some((x) => x.id === "diary-harper-record-003")).toBe(true);
  });
  it("не скрывает ошибки указателей и данных", () => {
    expect(() => parseDiaries([entries[0], entries[0]], refs)).toThrow(/Повторный ID/);
    expect(() => parseDiaries([{ ...entries[0], entityIds: [] }], refs)).toThrow(/отсутствует автор/);
    expect(() => parseDiaries([{ ...entries[0], storyIds: ["story-missing"] }], refs)).toThrow(/неизвестная.*история/);
    expect(() => parseDiaries([{ ...entries[0], hypothesisIds: ["H-999"] }], refs)).toThrow(/неизвестная.*гипотеза/);
    expect(() => parseDiaries([{ ...entries[0], entityIds: ["character-alexei-harper", "technology-neural-interface"] }], refs)).toThrow(/непубличная/);
    expect(() => parseDiaries([{ ...entries[0], hypothesisIds: ["H-010", "H-010"] }], refs)).toThrow(/повторный указатель/);
    expect(() => parseDiaries([{ ...entries[0], paragraphs: ["  "] }], refs)).toThrow();
    expect(() => parseDiaries([{ ...entries[0], medium: "audio" }], refs)).toThrow();
  });
});
