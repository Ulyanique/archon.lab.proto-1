import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { findRepoRoot } from "@archon/lore-parser";
import { isPublishedStatus } from "@archon/lore-schema";
import { getKb } from "./lore";
import { getHypotheses } from "./workshop";
import { getStories } from "./stories";

const text = z.string().refine((s) => s.trim().length > 0, "Обязателен непустой текст");
const entrySchema = z.object({
  id: z.string().regex(/^diary-harper-[a-z0-9]+(?:-[a-z0-9]+)*$/), title: text,
  medium: z.enum(["paper", "digital"]), kind: z.enum(["observation", "work", "mystery"]), timeNote: text, summary: text,
  entityIds: z.array(z.string()), hypothesisIds: z.array(z.string()), storyIds: z.array(z.string()), paragraphs: z.array(text).min(1),
});
export type DiaryEntry = z.infer<typeof entrySchema>;
export type DiaryReferences = { entityIds: ReadonlySet<string>; hypothesisIds: ReadonlySet<string>; storyIds: ReadonlySet<string> };

/** Форма и публичные указатели, не проверка достоверности мнения рассказчика. */
export function parseDiaries(input: unknown, refs: DiaryReferences): DiaryEntry[] {
  const entries = z.array(entrySchema).parse(input);
  const ids = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) throw new Error(`Повторный ID дневника: ${entry.id}`);
    ids.add(entry.id);
    if (!entry.entityIds.includes("character-alexei-harper")) throw new Error(`${entry.id}: отсутствует автор Харпер`);
    for (const [values, allowed, name] of [[entry.entityIds, refs.entityIds, "запись"], [entry.hypothesisIds, refs.hypothesisIds, "гипотеза"], [entry.storyIds, refs.storyIds, "история"]] as const) {
      if (new Set(values).size !== values.length) throw new Error(`${entry.id}: повторный указатель (${name})`);
      for (const value of values) if (!allowed.has(value)) throw new Error(`${entry.id}: неизвестная или непубличная ${name}: ${value}`);
    }
  }
  return entries;
}
export function getDiaries(): DiaryEntry[] {
  const root = findRepoRoot();
  return parseDiaries(JSON.parse(readFileSync(join(root, "drafts/diaries/harper.json"), "utf8")), {
    entityIds: new Set(getKb().entities.filter((item) => isPublishedStatus(item.fm.status)).map((item) => item.id)),
    hypothesisIds: new Set(getHypotheses(root).map((item) => item.id)),
    storyIds: new Set(getStories().map((item) => item.id)),
  });
}
export const diariesForEntity = (id: string, entries: DiaryEntry[]) => entries.filter((entry) => entry.entityIds.includes(id));
export const diariesForStory = (id: string, entries: DiaryEntry[]) => entries.filter((entry) => entry.storyIds.includes(id));
