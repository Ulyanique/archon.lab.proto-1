#!/usr/bin/env tsx
/**
 * CLI базы знаний Archon.
 *   npx tsx scripts/lore.ts <validate|index|graph|check-links|report|build> [--json] [--strict]
 * Ни одна команда не изменяет канон. `index` перезаписывает только сгенерированный реестр
 * universe/00-meta/Реестр сущностей.md и файлы в build/lore/.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { findRepoRoot, loadKnowledgeBase, type KnowledgeBase } from "@archon/lore-parser";
import { buildReport, renderReportMarkdown, summarize, validateKnowledgeBase, type Diagnostic } from "@archon/lore-validator";
import { isPublishedStatus } from "@archon/lore-schema";
import { validateMediaCatalog } from "../src/lib/media-validation";
import { parseDiaries } from "../src/lib/diaries";
import { getStories, parseStories } from "../src/lib/stories";
import { getDraftConcepts, getHypotheses } from "../src/lib/workshop";
import { REGISTRY_PATH, buildGraph, buildIndex, buildRegistryMarkdown, buildTimeline } from "@archon/lore-indexer";

const COMMANDS = ["validate", "index", "graph", "check-links", "report", "build"] as const;
type Command = (typeof COMMANDS)[number];

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith("--")) as Command | undefined;
const asJson = args.includes("--json");
const strict = args.includes("--strict");

const color = (code: number, s: string) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);

function writeOut(root: string, rel: string, content: string) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content.endsWith("\n") ? content : `${content}\n`, "utf8");
  console.log(`  → ${rel}`);
}

/** Проверка актуальности сгенерированного реестра (предупреждение, не ошибка). */
function registryDiagnostics(root: string, kb: KnowledgeBase): Diagnostic[] {
  const abs = join(root, REGISTRY_PATH);
  const expected = buildRegistryMarkdown(kb);
  const actual = existsSync(abs) ? readFileSync(abs, "utf8") : "";
  if (actual.replace(/\r\n/g, "\n").trimEnd() === expected.trimEnd()) return [];
  return [{ severity: "warning", code: "REGISTRY-STALE", message: "реестр сущностей устарел: выполните `npx tsx scripts/lore.ts index`", path: REGISTRY_PATH }];
}

function printDiagnostics(diags: Diagnostic[]) {
  for (const d of diags) {
    const tag = d.severity === "error" ? color(31, "ERROR  ") : d.severity === "warning" ? color(33, "WARNING") : color(36, "INFO   ");
    console.log(`${tag} ${d.code.padEnd(18)} ${d.path}${d.line ? `:${d.line}` : ""}\n        ${d.message}`);
  }
}

function storyDiagnostics(root: string, kb: KnowledgeBase): Diagnostic[] {
  const path = "drafts/stories/catalog.json";
  try {
    parseStories(JSON.parse(readFileSync(join(root, path), "utf8")), {
      entityIds: new Set(kb.entities.filter((entity) => isPublishedStatus(entity.fm.status)).map((entity) => entity.id)),
      eventIds: new Set(kb.entities.filter((entity) => isPublishedStatus(entity.fm.status) && entity.fm.type === "event").map((entity) => entity.id)),
      characterIds: new Set(kb.entities.filter((entity) => isPublishedStatus(entity.fm.status) && (entity.fm.type === "character" || entity.fm.type === "ai")).map((entity) => entity.id)),
      hypothesisIds: new Set(getHypotheses(root).map((item) => item.id)),
      conceptHeadings: new Map(getDraftConcepts(root).map((concept) => [concept.slug, new Set(concept.doc.headings.map((heading) => heading.text))])),
    });
    return [];
  } catch (error) { return [{ severity: "error", code: "STORY-INVALID", path, message: error instanceof Error ? error.message : String(error) }]; }
}

function diaryDiagnostics(root: string, kb: KnowledgeBase): Diagnostic[] {
  const path = "drafts/diaries/harper.json";
  try {
    parseDiaries(JSON.parse(readFileSync(join(root, path), "utf8")), {
      entityIds: new Set(kb.entities.filter((entity) => isPublishedStatus(entity.fm.status)).map((entity) => entity.id)),
      hypothesisIds: new Set(getHypotheses(root).map((item) => item.id)),
      storyIds: new Set(getStories().map((story) => story.id)),
    });
    return [];
  } catch (error) { return [{ severity: "error", code: "DIARY-INVALID", path, message: error instanceof Error ? error.message : String(error) }]; }
}

function allDiagnostics(root: string, kb: KnowledgeBase): Diagnostic[] {
  const publishedIds = new Set(kb.entities.filter((entity) => isPublishedStatus(entity.fm.status)).map((entity) => entity.id));
  return [...validateKnowledgeBase(kb), ...registryDiagnostics(root, kb), ...validateMediaCatalog(root, publishedIds), ...storyDiagnostics(root, kb), ...diaryDiagnostics(root, kb)];
}

function runValidate(root: string, kb: KnowledgeBase, filter?: (d: Diagnostic) => boolean): { diags: Diagnostic[]; failed: boolean } {
  let diags = allDiagnostics(root, kb);
  if (filter) diags = diags.filter(filter);
  const { errors, warnings } = summarize(diags);
  if (asJson) console.log(JSON.stringify({ errors, warnings, diagnostics: diags }, null, 2));
  else {
    printDiagnostics(diags);
    const status = errors > 0 ? color(31, "FAILED") : color(32, "OK");
    console.log(`\nСущностей: ${kb.entities.length} | документов: ${kb.documents.length} | ошибок: ${errors} | предупреждений: ${warnings} → ${status}`);
  }
  return { diags, failed: errors > 0 || (strict && warnings > 0) };
}

function runIndex(root: string, kb: KnowledgeBase) {
  console.log("Индексы:");
  writeOut(root, "build/lore/index.json", JSON.stringify(buildIndex(kb), null, 2));
  writeOut(root, "build/lore/timeline.json", JSON.stringify(buildTimeline(kb), null, 2));
  const registry = buildRegistryMarkdown(kb);
  const abs = join(root, REGISTRY_PATH);
  if (!existsSync(abs) || readFileSync(abs, "utf8").replace(/\r\n/g, "\n").trimEnd() !== registry.trimEnd()) writeOut(root, REGISTRY_PATH, registry);
  else console.log(`  = ${REGISTRY_PATH} (без изменений)`);
}

function runGraph(root: string, kb: KnowledgeBase) {
  const graph = buildGraph(kb);
  console.log(`Граф: ${graph.nodes.length} узлов, ${graph.edges.length} рёбер`);
  writeOut(root, "build/lore/graph.json", JSON.stringify(graph, null, 2));
}

function runReport(root: string, kb: KnowledgeBase) {
  const diags = allDiagnostics(root, kb);
  const report = buildReport(kb, diags);
  console.log("Отчёт:");
  writeOut(root, "build/lore/contradictions.md", renderReportMarkdown(report, diags));
  writeOut(root, "build/lore/report.json", JSON.stringify(report, null, 2));
  for (const g of report.heuristics) console.log(`  ${g.code.padEnd(20)} ${g.items.length}`);
  console.log(`  ${"DECLARED-UNKNOWNS".padEnd(20)} ${report.declared.reduce((n, d) => n + d.items.length, 0)}`);
}

function main() {
  if (!command || !COMMANDS.includes(command)) {
    console.error(`Использование: npx tsx scripts/lore.ts <${COMMANDS.join("|")}> [--json] [--strict]`);
    process.exit(command ? 2 : 0);
  }
  const root = findRepoRoot();
  const kb = loadKnowledgeBase(root);
  let failed = false;
  switch (command) {
    case "validate":
      failed = runValidate(root, kb).failed;
      break;
    case "check-links":
      failed = runValidate(root, kb, (d) => d.code.startsWith("LINK-") || d.code.startsWith("REF-") || d.code.startsWith("MEDIA-REF") || d.code.startsWith("DIARY-")).failed;
      break;
    case "index":
      runIndex(root, kb);
      break;
    case "graph":
      runGraph(root, kb);
      break;
    case "report":
      runReport(root, kb);
      break;
    case "build": {
      // Индекс первым: он обновляет реестр, который проверяет validate.
      runIndex(root, loadKnowledgeBase(root));
      const fresh = loadKnowledgeBase(root);
      failed = runValidate(root, fresh).failed;
      if (!failed) {
        runGraph(root, fresh);
        runReport(root, fresh);
      }
      break;
    }
  }
  process.exit(failed ? 1 : 0);
}

main();
