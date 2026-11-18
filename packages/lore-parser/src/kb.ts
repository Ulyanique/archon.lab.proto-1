import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix } from "node:path";
import { entityFrontmatterSchema, normalizeName, type EntityFrontmatter } from "@archon/lore-schema";
import { parseDocument, type LoreDocument } from "./parse";

export interface Entity {
  id: string;
  fm: EntityFrontmatter;
  doc: LoreDocument;
}

export interface InvalidEntity {
  doc: LoreDocument;
  /** Сообщения Zod вида `путь: сообщение`. */
  issues: string[];
}

export type Resolution =
  | { status: "ok"; doc: LoreDocument; entity?: Entity }
  | { status: "ambiguous"; docs: LoreDocument[] }
  | { status: "missing" };

export interface KnowledgeBase {
  root: string;
  documents: LoreDocument[];
  entities: Entity[];
  invalid: InvalidEntity[];
  /** Все файлы репозитория (кроме служебных каталогов), пути от корня. */
  allFiles: Set<string>;
  byId: Map<string, Entity>;
  /** Разрешение вики-ссылки по имени файла, title, alias, id (Obsidian-совместимо: без учёта регистра). */
  resolveWiki(target: string): Resolution;
  /** Существует ли файл по пути от корня. */
  fileExists(path: string): boolean;
  /** Разрешение пути из markdown-ссылки относительно документа. */
  resolveRelative(fromDocPath: string, target: string): string;
}

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "build", "coverage", ".obsidian", "out"]);
/**
 * Какие .md входят в базу знаний: весь `universe/` (сущности и мета-заметки), а также
 * документация (`docs/`, корневые *.md) — для проверки ссылок. Шаблоны, черновики и
 * служебные файлы (.github, assets) не сканируются.
 */
export function isLorePath(path: string): boolean {
  return path.endsWith(".md") && (path.startsWith("universe/") || path.startsWith("docs/") || !path.includes("/"));
}

function walk(root: string, rel = ""): string[] {
  const dir = join(/*turbopackIgnore: true*/ root, rel);
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(root, relPath));
    else if (entry.isFile()) out.push(relPath.normalize("NFC"));
  }
  return out;
}

export interface RawFile {
  path: string;
  content: string;
}

/** Чистая сборка базы знаний из набора файлов (используется тестами и загрузчиком). */
export function buildKnowledgeBase(root: string, files: RawFile[], allFilePaths?: string[]): KnowledgeBase {
  const documents = files.map((f) => parseDocument(f.path, f.content));
  const entities: Entity[] = [];
  const invalid: InvalidEntity[] = [];

  for (const doc of documents) {
    if (doc.kind !== "entity") continue;
    const fm = doc.frontmatter;
    if (!doc.hasFrontmatter || doc.yamlErrors.length > 0 || fm === null || typeof fm !== "object" || Array.isArray(fm)) {
      invalid.push({ doc, issues: [] });
      continue;
    }
    const parsed = entityFrontmatterSchema.safeParse(fm);
    if (parsed.success) entities.push({ id: parsed.data.id, fm: parsed.data, doc });
    else
      invalid.push({
        doc,
        issues: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
      });
  }

  const byId = new Map<string, Entity>();
  for (const e of entities) if (!byId.has(e.id)) byId.set(e.id, e);

  const names = new Map<string, Set<LoreDocument>>();
  const addName = (name: string, doc: LoreDocument) => {
    const key = normalizeName(name);
    if (!names.has(key)) names.set(key, new Set());
    names.get(key)!.add(doc);
  };
  for (const doc of documents) addName(doc.fileName, doc);
  for (const e of entities) {
    addName(e.fm.title, e.doc);
    for (const a of e.fm.aliases) addName(a, e.doc);
    addName(e.id, e.doc);
  }
  const entityByDoc = new Map(entities.map((e) => [e.doc, e]));

  const allFiles = new Set(allFilePaths ?? files.map((f) => f.path.normalize("NFC")));
  // Каталоги тоже допустимые цели ссылок (например `[docs](docs/)`).
  const allDirs = new Set<string>();
  for (const p of allFiles) {
    const parts = p.split("/");
    for (let i = 1; i < parts.length; i++) allDirs.add(parts.slice(0, i).join("/"));
  }
  const assetBasenames = new Map<string, string>();
  for (const p of allFiles) if (!p.endsWith(".md")) assetBasenames.set(normalizeName(p.split("/").pop() ?? p), p);

  return {
    root,
    documents,
    entities,
    invalid,
    allFiles,
    byId,
    fileExists: (p) => {
      const norm = p.normalize("NFC").replace(/\/+$/, "");
      return allFiles.has(norm) || allDirs.has(norm);
    },
    resolveRelative: (from, target) => {
      let decoded = target;
      try {
        decoded = decodeURIComponent(target);
      } catch {
        /* оставляем как есть */
      }
      return posix.normalize(posix.join(posix.dirname(from), decoded)).normalize("NFC");
    },
    resolveWiki(target) {
      const key = normalizeName(target);
      if (!key) return { status: "missing" };
      // Вложения/файлы с расширением (кроме .md) ищем среди не-markdown файлов по basename.
      if (/\.[a-z0-9]{2,5}$/i.test(key) && !key.endsWith(".md")) {
        const asset = assetBasenames.get(key);
        return asset ? { status: "ok", doc: { path: asset } as LoreDocument } : { status: "missing" };
      }
      const hits = names.get(key.replace(/\.md$/, ""));
      if (!hits || hits.size === 0) return { status: "missing" };
      const docs = [...hits];
      if (docs.length > 1) return { status: "ambiguous", docs };
      return { status: "ok", doc: docs[0], entity: entityByDoc.get(docs[0]) };
    },
  };
}

/** Находит корень репозитория (каталог с `universe/`), поднимаясь от `start`. */
export function findRepoRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "universe")) && statSync(join(dir, "universe")).isDirectory()) return dir;
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Не найден каталог universe/ выше ${start}`);
}

/** Загружает базу знаний с диска. */
export function loadKnowledgeBase(root = findRepoRoot()): KnowledgeBase {
  const allFilePaths = walk(root);
  const mdFiles = allFilePaths.filter(isLorePath);
  const files: RawFile[] = mdFiles.sort().map((p) => ({ path: p, content: readFileSync(join(/*turbopackIgnore: true*/ root, p), "utf8") }));
  return buildKnowledgeBase(root, files, allFilePaths);
}
