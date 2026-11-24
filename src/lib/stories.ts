import { z } from "zod";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findRepoRoot } from "@archon/lore-parser";
import { isPublishedStatus } from "@archon/lore-schema";
import { getKb } from "./lore";
import { getDraftConcepts, getHypotheses } from "./workshop";

const text = z.string().refine((value) => value.trim().length > 0, "Обязателен непустой текст");
const entityIds = z.array(z.string().regex(/^[a-z][a-z0-9-]*$/));
const hypothesisIds = z.array(z.string().regex(/^H-\d{3,}$/));
const sceneSchema = z.object({
  id: z.string().regex(/^scene-[a-z0-9]+(?:-[a-z0-9]+)*$/), title: text, status: z.enum(["outline", "sample"]), purpose: text,
  sourceHeading: text, adaptations: z.array(z.object({ label: text, sourceHeading: text })).optional(), entityIds, hypothesisIds, eventIds: entityIds, chronology: text,
  knowledge: z.array(z.object({ role: text, entityId: z.string().regex(/^[a-z][a-z0-9-]*$/).optional(), known: text, unknown: text })), openQuestions: z.array(text),
});
const storySchema = z.object({
  id: z.string().regex(/^story-[a-z0-9]+(?:-[a-z0-9]+)*$/), title: text, status: z.literal("working"), summary: text,
  conceptSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), entityIds, hypothesisIds, openQuestions: z.array(text), scenes: z.array(sceneSchema),
});
export type Story = z.infer<typeof storySchema>;
export type StoryReferences = { entityIds: ReadonlySet<string>; eventIds: ReadonlySet<string>; characterIds: ReadonlySet<string>; hypothesisIds: ReadonlySet<string>; conceptHeadings: ReadonlyMap<string, ReadonlySet<string>> };

/** Проверяет форму и указатели, но не делает выводов об истинности или полноте сюжета. */
export function parseStories(input: unknown, refs: StoryReferences): Story[] {
  const stories = z.array(storySchema).parse(input);
  const storyIds = new Set<string>(), sceneIds = new Set<string>();
  const checkIds = (owner: string, values: string[], known: ReadonlySet<string>, kind: string) => {
    if (new Set(values).size !== values.length) throw new Error(`${owner}: повторный ${kind}`);
    for (const id of values) if (!known.has(id)) throw new Error(`${owner}: неизвестный или непубличный ${kind}: ${id}`);
  };
  for (const story of stories) {
    if (storyIds.has(story.id)) throw new Error(`Повторный ID истории: ${story.id}`);
    storyIds.add(story.id);
    const headings = refs.conceptHeadings.get(story.conceptSlug);
    if (!headings) throw new Error(`${story.id}: не найдена публичная концепция ${story.conceptSlug}`);
    checkIds(story.id, story.entityIds, refs.entityIds, "ID записи");
    checkIds(story.id, story.hypothesisIds, refs.hypothesisIds, "ID гипотезы");
    for (const scene of story.scenes) {
      if (sceneIds.has(scene.id)) throw new Error(`Повторный ID сцены: ${scene.id}`);
      sceneIds.add(scene.id);
      if (new Set(scene.knowledge.map((item) => item.role)).size !== scene.knowledge.length) throw new Error(`${scene.id}: повторная роль`);
      if (!headings.has(scene.sourceHeading)) throw new Error(`${scene.id}: не найден раздел источника ${scene.sourceHeading}`);
      if (scene.adaptations) {
        if (new Set(scene.adaptations.map((item) => item.label)).size !== scene.adaptations.length) throw new Error(`${scene.id}: повторное название адаптации`);
        for (const adaptation of scene.adaptations) if (!headings.has(adaptation.sourceHeading)) throw new Error(`${scene.id}: не найден раздел адаптации ${adaptation.sourceHeading}`);
      }
      checkIds(scene.id, scene.entityIds, refs.entityIds, "ID записи");
      checkIds(scene.id, scene.hypothesisIds, refs.hypothesisIds, "ID гипотезы");
      checkIds(scene.id, scene.eventIds, refs.eventIds, "ID события");
      for (const person of scene.knowledge) if (person.entityId && !refs.characterIds.has(person.entityId)) throw new Error(`${scene.id}: неизвестный или непубличный ID персонажа: ${person.entityId}`);
    }
  }
  return stories;
}
export function getStories(): Story[] {
  const kb = getKb();
  const data: unknown = JSON.parse(readFileSync(join(findRepoRoot(), "drafts/stories/catalog.json"), "utf8"));
  return parseStories(data, {
    entityIds: new Set(kb.entities.filter((entity) => isPublishedStatus(entity.fm.status)).map((entity) => entity.id)),
    eventIds: new Set(kb.entities.filter((entity) => isPublishedStatus(entity.fm.status) && entity.fm.type === "event").map((entity) => entity.id)),
    characterIds: new Set(kb.entities.filter((entity) => isPublishedStatus(entity.fm.status) && (entity.fm.type === "character" || entity.fm.type === "ai")).map((entity) => entity.id)),
    hypothesisIds: new Set(getHypotheses().map((item) => item.id)),
    conceptHeadings: new Map(getDraftConcepts().map((concept) => [concept.slug, new Set(concept.doc.headings.map((heading) => heading.text))])),
  });
}

/** Указатели на рабочие истории не добавляют связи в опубликованный лор. */
export function storiesForEntity(id: string, stories: Story[]): Story[] {
  return stories.filter((story) => story.entityIds.includes(id) || story.scenes.some((scene) => scene.entityIds.includes(id) || scene.eventIds.includes(id) || scene.knowledge.some((entry) => entry.entityId === id)));
}
export function storiesForHypothesis(id: string, stories: Story[]): Story[] {
  return stories.filter((story) => story.hypothesisIds.includes(id) || story.scenes.some((scene) => scene.hypothesisIds.includes(id)));
}
