import { cache } from "react";
import { loadKnowledgeBase, type Entity, type KnowledgeBase, type LoreDocument } from "@archon/lore-parser";
import {
  SECTIONS,
  isPublishedStatus,
  type SectionKey,
} from "@archon/lore-schema";
import { REGISTRY_PATH, buildGraph, buildTimeline, toIndexEntry, type GraphEdge, type IndexEntry } from "@archon/lore-indexer";
import { slugify } from "./markdown";

/**
 * Единственная точка доступа энциклопедии к данным.
 * Читает universe/ напрямую во время сборки — отдельной копии базы знаний нет.
 */
let cached: KnowledgeBase | null = null;
// В dev повторное чтение в рамках одного серверного рендера не сканирует весь репозиторий.
// Между запросами React сбрасывает cache, поэтому правки Markdown остаются видимыми.
const loadForRender = cache(loadKnowledgeBase);

export function getKb(): KnowledgeBase {
  if (process.env.NODE_ENV !== "production") return loadForRender();
  return (cached ??= loadKnowledgeBase());
}

export function publishedEntities(kb = getKb()): Entity[] {
  return kb.entities.filter((e) => isPublishedStatus(e.fm.status));
}

export function publishedIndex(kb = getKb()): IndexEntry[] {
  return publishedEntities(kb).map(toIndexEntry);
}

export function entitiesInSection(section: SectionKey, kb = getKb()): Entity[] {
  const types = SECTIONS[section].types;
  return publishedEntities(kb)
    .filter((e) => types.includes(e.fm.type))
    .sort((a, b) => a.fm.title.localeCompare(b.fm.title, "ru"));
}

export interface MetaNote {
  slug: string;
  doc: LoreDocument;
}

export function metaNotes(kb = getKb()): MetaNote[] {
  const notes = kb.documents
    // Полный реестр содержит также draft/archived и предназначен только для работы в репозитории.
    .filter((d) => d.kind === "meta" && d.path !== REGISTRY_PATH)
    .map((doc) => ({ slug: slugify(doc.fileName), doc }))
    .sort((a, b) => a.doc.fileName.localeCompare(b.doc.fileName, "ru"));
  const seen = new Map<string, string>();
  for (const { slug, doc } of notes) {
    if (!slug) throw new Error(`Пустой URL мета-заметки: ${doc.path}`);
    const previous = seen.get(slug);
    if (previous) throw new Error(`Одинаковый URL мета-заметок «${slug}»: ${previous} и ${doc.path}`);
    seen.set(slug, doc.path);
  }
  return notes;
}

export interface LinkedEntity {
  edge: GraphEdge;
  entity: Entity;
}

/** Связи сущности (исходящие и входящие) только с опубликованными сущностями. */
export function linksFor(id: string, kb = getKb()): { outgoing: LinkedEntity[]; incoming: LinkedEntity[] } {
  const graph = buildGraph(kb);
  const pick = (edges: GraphEdge[], end: "source" | "target"): LinkedEntity[] =>
    edges.flatMap((edge) => {
      const entity = kb.byId.get(edge[end]);
      return entity && isPublishedStatus(entity.fm.status) ? [{ edge, entity }] : [];
    });
  return {
    outgoing: pick(graph.edges.filter((e) => e.source === id), "target"),
    incoming: pick(graph.edges.filter((e) => e.target === id), "source"),
  };
}

export function allEdgesForSite(kb = getKb()) {
  const graph = buildGraph(kb);
  return graph.edges.filter((e) => {
    const s = kb.byId.get(e.source);
    const t = kb.byId.get(e.target);
    return s && t && isPublishedStatus(s.fm.status) && isPublishedStatus(t.fm.status);
  });
}

export function timelineForSite(kb = getKb()) {
  const tl = buildTimeline(kb);
  return { dated: tl.dated.filter((e) => e.published), undated: tl.undated.filter((e) => e.published) };
}
