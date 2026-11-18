import { extractEdges, type Entity, type KnowledgeBase } from "@archon/lore-parser";
import { eventWindow } from "@archon/lore-validator";
import {
  ENTITY_TYPES,
  RELATION_TYPES,
  STATUS_INFO,
  TYPE_INFO,
  isPublishedStatus,
  type EntityFrontmatter,
} from "@archon/lore-schema";

/** Все индексы — производные данные; источник истины остаётся в universe/. */

export interface IndexEntry {
  id: string;
  title: string;
  type: EntityFrontmatter["type"];
  status: EntityFrontmatter["status"];
  section: string;
  published: boolean;
  aliases: string[];
  tags: string[];
  summary: string | null;
  path: string;
  fileName: string;
  created: string;
  updated: string;
  science_status: string | null;
  related: string[];
}

export function toIndexEntry(e: Entity): IndexEntry {
  return {
    id: e.id,
    title: e.fm.title,
    type: e.fm.type,
    status: e.fm.status,
    section: TYPE_INFO[e.fm.type].section,
    published: isPublishedStatus(e.fm.status),
    aliases: e.fm.aliases,
    tags: e.fm.tags,
    summary: e.fm.summary ?? null,
    path: e.doc.path,
    fileName: e.doc.fileName,
    created: e.fm.created,
    updated: e.fm.updated,
    science_status: e.fm.science_status ?? null,
    related: e.fm.related,
  };
}

const sortEntries = (a: Entity, b: Entity) =>
  ENTITY_TYPES.indexOf(a.fm.type) - ENTITY_TYPES.indexOf(b.fm.type) || a.id.localeCompare(b.id);

export function buildIndex(kb: KnowledgeBase) {
  const entities = [...kb.entities].sort(sortEntries).map(toIndexEntry);
  return {
    schema: "archon-lore-index/1",
    count: entities.length,
    entities,
    metaNotes: kb.documents.filter((d) => d.kind === "meta").map((d) => ({ fileName: d.fileName, path: d.path })),
  };
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  status: string;
  published: boolean;
}
export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  label: string;
  origin: "frontmatter" | "body";
  note?: string;
}

export function buildGraph(kb: KnowledgeBase) {
  const all = extractEdges(kb);
  // Слабая связь `mention` не дублирует явную связь между той же парой.
  const explicitPairs = new Set(all.filter((e) => e.type !== "mention").flatMap((e) => [`${e.source}|${e.target}`, `${e.target}|${e.source}`]));
  const edges: GraphEdge[] = all
    .filter((e) => e.type !== "mention" || !explicitPairs.has(`${e.source}|${e.target}`))
    .map((e) => ({
      source: e.source,
      target: e.target,
      type: e.type,
      label: RELATION_TYPES[e.type]?.label ?? e.type,
      origin: e.origin,
      ...(e.note ? { note: e.note } : {}),
    }));
  const nodes: GraphNode[] = [...kb.entities].sort(sortEntries).map((e) => ({
    id: e.id,
    label: e.fm.title,
    type: e.fm.type,
    status: e.fm.status,
    published: isPublishedStatus(e.fm.status),
  }));
  return { schema: "archon-lore-graph/1", nodes, edges };
}

export interface TimelineItem {
  id: string;
  title: string;
  status: string;
  published: boolean;
  precision: string;
  certainty: string;
  calendar: string;
  start: string | null;
  end: string | null;
  note: string | null;
  after: string[];
}

export function buildTimeline(kb: KnowledgeBase) {
  const items = kb.entities
    .filter((e) => e.fm.type === "event")
    .map((e) => {
      const d = e.fm.date!;
      const item: TimelineItem = {
        id: e.id,
        title: e.fm.title,
        status: e.fm.status,
        published: isPublishedStatus(e.fm.status),
        precision: d.precision,
        certainty: d.certainty,
        calendar: d.calendar,
        start: d.start ?? null,
        end: d.end ?? null,
        note: d.note ?? null,
        after: e.fm.after,
      };
      return { item, window: eventWindow(e) };
    });
  const dated = items.filter((i) => i.window).sort((a, b) => a.window!.lo.localeCompare(b.window!.lo) || a.item.id.localeCompare(b.item.id)).map((i) => i.item);
  const undated = items.filter((i) => !i.window).map((i) => i.item).sort((a, b) => a.id.localeCompare(b.id));
  return {
    schema: "archon-lore-timeline/1",
    note: "Глобальная хронология не вычисляется. `dated` — только события с григорианскими датами; остальные в `undated` без порядка.",
    dated,
    undated,
  };
}

export const REGISTRY_PATH = "universe/00-meta/Реестр сущностей.md";

/** Реестр сущностей в Markdown. Детерминирован (без временных меток), чтобы не создавать лишних диффов. */
export function buildRegistryMarkdown(kb: KnowledgeBase): string {
  const rows = [...kb.entities].sort(sortEntries);
  const L: string[] = [];
  L.push("<!-- GENERATED FILE: `npx tsx scripts/lore.ts index`. Не редактировать вручную — правки будут перезаписаны. -->", "");
  L.push("# Реестр сущностей", "");
  L.push("> Автоматически сформирован из frontmatter файлов `universe/`. Источник истины — сами статьи.", "");
  L.push(`Всего сущностей: **${rows.length}**.`, "");
  L.push("| ID | Название | Тип | Статус | Файл |", "|---|---|---|---|---|");
  for (const e of rows) {
    L.push(`| \`${e.id}\` | [[${e.doc.fileName}]] | ${TYPE_INFO[e.fm.type].label} | ${STATUS_INFO[e.fm.status].label} (\`${e.fm.status}\`) | \`${e.doc.path}\` |`);
  }
  L.push("");
  return L.join("\n");
}
