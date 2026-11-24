import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { findRepoRoot, parseDocument, type LoreDocument } from "@archon/lore-parser";
import { slugify } from "./markdown";
import { ID_REGEX, isPublishedStatus } from "@archon/lore-schema";
import type { Entity, KnowledgeBase } from "@archon/lore-parser";

export const HYPOTHESIS_FILE = "drafts/concepts/Гипотезы развития мира.md";
const CONCEPT_DIR = "drafts/concepts";

export interface Hypothesis {
  id: string;
  title: string;
  status: string;
  summary: string;
  references: string[];
  dependencies: string[];
  conflicts: string[];
  entityIds: string[];
  doc: LoreDocument;
}

/** Реестр — единственный источник. Некорректный или повторный ID не скрывается молча. */
export function parseHypotheses(text: string): Hypothesis[] {
  const headings = [...text.matchAll(/^##\s+(H-\S+)[ \t]+—[ \t]+([^\n]+)\s*$/gm)];
  const expected = [...text.matchAll(/^##\s+H-\S+.*$/gm)];
  if (headings.length !== expected.length) throw new Error("Неверный заголовок гипотезы: ожидается ## H-001 — название");
  const seen = new Set<string>();
  return headings.map((m, i) => {
    const id = m[1];
    if (!/^H-\d{3,}$/.test(id) || seen.has(id)) throw new Error(`Некорректный или повторный ID гипотезы: ${id}`);
    seen.add(id);
    const body = text.slice(m.index! + m[0].length, headings[i + 1]?.index ?? text.length).trim();
    const field = (name: string) => body.match(new RegExp(`\\*\\*${name}:\\*\\*\\s*([^\\n]+)`))?.[1].trim() ?? "";
    const status = field("Статус").split(". **")[0].replace(/\.$/, "") || "не указан";
    const references = [...new Set(body.match(/\bH-\d{3,}\b/g) ?? [])].filter((ref) => ref !== id);
    const dependencyField = field("ID обязательных зависимостей");
    // Старые внешние примеры без поля остаются допустимыми; в реестре поле обязательно.
    const dependencies = dependencyField && dependencyField !== "нет" ? dependencyField.split(",").map((v) => v.trim()) : [];
    if (dependencies.some((v) => !/^H-\d{3,}$/.test(v) || v === id) || new Set(dependencies).size !== dependencies.length) {
      throw new Error(`Некорректные зависимости гипотезы ${id}`);
    }
    const conflictField = field("ID несовместимых гипотез");
    const conflicts = conflictField && conflictField !== "нет" ? conflictField.split(",").map((v) => v.trim()) : [];
    if (conflicts.some((v) => !/^H-\d{3,}$/.test(v) || v === id) || new Set(conflicts).size !== conflicts.length) throw new Error(`Некорректные несовместимые гипотезы ${id}`);
    const entityField = field("ID записей архива");
    const entityIds = entityField && entityField !== "нет" ? entityField.split(",").map((v) => v.trim()) : [];
    if (entityIds.some((value) => !ID_REGEX.test(value)) || new Set(entityIds).size !== entityIds.length) {
      throw new Error(`Некорректные ID записей архива в гипотезе ${id}`);
    }
    return { id, title: m[2].trim(), status, summary: field("Суть"), references, dependencies, conflicts, entityIds, doc: parseDocument(HYPOTHESIS_FILE, body) };
  });
}

export function getHypotheses(root = findRepoRoot()): Hypothesis[] {
  const text = readFileSync(join(root, HYPOTHESIS_FILE), "utf8");
  const hypotheses = parseHypotheses(text);
  const known = new Set(hypotheses.map((h) => h.id));
  for (const item of hypotheses) {
    if (!item.doc.body.match(/\*\*ID обязательных зависимостей:\*\*/)) throw new Error(`Не указаны ID зависимостей ${item.id}`);
    if (!item.doc.body.match(/\*\*ID записей архива:\*\*/)) throw new Error(`Не указаны ID записей архива ${item.id}`);
    for (const dependency of item.dependencies) if (!known.has(dependency)) throw new Error(`Не найдена зависимость ${item.id}: ${dependency}`);
    for (const conflict of item.conflicts) {
      const other = hypotheses.find((hypothesis) => hypothesis.id === conflict);
      if (!other || !other.conflicts.includes(item.id)) throw new Error(`Несимметричная или неизвестная несовместимость ${item.id}: ${conflict}`);
    }
  }
  return hypotheses;
}

export interface DraftConcept { slug: string; title: string; hypothesisIds: string[]; doc: LoreDocument }

/** Только явно выбранная папка концепций; остальные drafts остаются приватными. */
export function getDraftConcepts(root = findRepoRoot()): DraftConcept[] {
  const dir = join(root, CONCEPT_DIR);
  const files = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith(".md") && e.name !== "Гипотезы развития мира.md");
  const seen = new Set<string>();
  const knownHypotheses = new Set(getHypotheses(root).map((item) => item.id));
  return files.map((f) => {
    const doc = parseDocument(`${CONCEPT_DIR}/${f.name}`, readFileSync(join(dir, f.name), "utf8"));
    const slug = slugify(doc.fileName);
    if (!slug || seen.has(slug)) throw new Error(`Пустой или повторный URL черновой концепции: ${doc.path}`);
    seen.add(slug);
    const field = doc.body.match(/^\*\*ID упомянутых гипотез:\*\*[ \t]*([^\n]+)$/m)?.[1].trim();
    const hypothesisIds = field && field !== "нет" ? field.split(",").map((id) => id.trim()) : [];
    if (hypothesisIds.some((id) => !/^H-\d{3,}$/.test(id)) || new Set(hypothesisIds).size !== hypothesisIds.length) throw new Error(`Некорректные ID гипотез в концепции: ${doc.path}`);
    for (const id of hypothesisIds) if (!knownHypotheses.has(id)) throw new Error(`Не найдена гипотеза ${id} в концепции: ${doc.path}`);
    return { slug, title: doc.headings.find((h) => h.level === 1)?.text ?? doc.fileName, hypothesisIds, doc };
  }).sort((a, b) => a.title.localeCompare(b.title, "ru"));
}

/** Не выводим записи с непубличным статусом; отсутствие ID не выдаём за отсутствие привязки. */
export function resolveHypothesisEntities(item: Pick<Hypothesis, "entityIds">, kb: Pick<KnowledgeBase, "byId">): { entities: Entity[]; unavailable: number } {
  const entities: Entity[] = [];
  let unavailable = 0;
  for (const id of item.entityIds) {
    const entity = kb.byId.get(id);
    if (entity && isPublishedStatus(entity.fm.status)) entities.push(entity);
    else unavailable++;
  }
  return { entities, unavailable };
}

/** Обратный указатель только из публичного реестра, а не утверждение новой связи лора. */
export function hypothesesForEntity(id: string, hypotheses: Hypothesis[]): Hypothesis[] {
  return hypotheses.filter((item) => item.entityIds.includes(id));
}

/** Явные указатели только из публичных черновых концепций; не устанавливают зависимость или канон. */
export function conceptsMentioningHypothesis(id: string, concepts: DraftConcept[]): DraftConcept[] {
  return concepts.filter((concept) => concept.hypothesisIds.includes(id));
}
