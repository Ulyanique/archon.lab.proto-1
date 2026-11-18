import YAML from "yaml";

export type DocumentKind = "entity" | "meta" | "source";

export interface LoreLink {
  kind: "wiki" | "markdown";
  /** Встраивание (`![[...]]` / `![](...)`). */
  embed: boolean;
  /** Цель без якоря и алиаса. */
  target: string;
  heading?: string;
  alias?: string;
  raw: string;
  /** 1-индексированная строка в исходном файле. */
  line: number;
}

export interface Heading {
  level: number;
  text: string;
  line: number;
}

export interface LoreDocument {
  /** Путь от корня репозитория, разделитель `/`, NFC. */
  path: string;
  /** Имя файла без `.md`, NFC. */
  fileName: string;
  /** Первая папка внутри `universe/` (например `03-locations`) либо пустая строка. */
  folder: string;
  kind: DocumentKind;
  hasFrontmatter: boolean;
  /** Результат разбора YAML (может быть не объектом — это ловит валидатор). */
  frontmatter: unknown;
  yamlErrors: string[];
  body: string;
  /** Номер строки (1-инд.), с которой начинается тело. */
  bodyStartLine: number;
  links: LoreLink[];
  headings: Heading[];
  /** Содержимое разделов `##` по тексту заголовка. */
  sections: Record<string, string>;
}

export function classifyPath(path: string): DocumentKind {
  if (path.startsWith("universe/00-meta/")) return "meta";
  if (path.startsWith("universe/")) return "entity";
  return "source";
}

interface FrontmatterSplit {
  has: boolean;
  text: string;
  bodyOffsetLines: number;
  body: string;
  error?: string;
}

export function splitFrontmatter(raw: string): FrontmatterSplit {
  const content = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!content.startsWith("---\n") && content.trim() !== "---") {
    return { has: false, text: "", bodyOffsetLines: 0, body: content };
  }
  const lines = content.split("\n");
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === "---" || lines[i].trimEnd() === "...") {
      return {
        has: true,
        text: lines.slice(1, i).join("\n"),
        bodyOffsetLines: i + 1,
        body: lines.slice(i + 1).join("\n"),
      };
    }
  }
  return { has: true, text: "", bodyOffsetLines: lines.length, body: "", error: "frontmatter не закрыт строкой `---`" };
}

/** Заменяет код (блоки и inline) пробелами, сохраняя переводы строк, чтобы не терять нумерацию. */
export function maskCode(text: string): string {
  const blank = (m: string) => m.replace(/[^\n]/g, " ");
  return text
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, blank)
    .replace(/(`+)[^`\n]*?\1/g, blank);
}

const WIKI_RE = /(!?)\[\[([^\[\]\n]+?)\]\]/g;
const MD_RE = /(!?)\[([^\]\n]*)\]\((?:<([^>\n]+)>|([^)\s]+))(?:\s+"[^"]*")?\)/g;
const EXTERNAL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

function lineAt(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

export function extractLinks(maskedBody: string, firstLine: number): LoreLink[] {
  const links: LoreLink[] = [];
  for (const m of maskedBody.matchAll(WIKI_RE)) {
    const inner = m[2].replace(/\\\|/g, "|");
    const [targetPart, ...aliasParts] = inner.split("|");
    const alias = aliasParts.length ? aliasParts.join("|").trim() : undefined;
    const hashIdx = targetPart.indexOf("#");
    const target = (hashIdx >= 0 ? targetPart.slice(0, hashIdx) : targetPart).normalize("NFC").trim();
    const heading = hashIdx >= 0 ? targetPart.slice(hashIdx + 1).trim() : undefined;
    links.push({
      kind: "wiki",
      embed: m[1] === "!",
      target,
      heading: heading || undefined,
      alias,
      raw: m[0],
      line: firstLine + lineAt(maskedBody, m.index ?? 0) - 1,
    });
  }
  for (const m of maskedBody.matchAll(MD_RE)) {
    const rawTarget = (m[3] ?? m[4] ?? "").trim();
    if (!rawTarget || EXTERNAL_RE.test(rawTarget)) continue;
    const hashIdx = rawTarget.indexOf("#");
    const pathPart = (hashIdx >= 0 ? rawTarget.slice(0, hashIdx) : rawTarget).split("?")[0];
    if (!pathPart) continue;
    links.push({
      kind: "markdown",
      embed: m[1] === "!",
      target: pathPart,
      heading: hashIdx >= 0 ? rawTarget.slice(hashIdx + 1) : undefined,
      alias: m[2] || undefined,
      raw: m[0],
      line: firstLine + lineAt(maskedBody, m.index ?? 0) - 1,
    });
  }
  return links;
}

export function extractHeadings(maskedBody: string, firstLine: number): Heading[] {
  const headings: Heading[] = [];
  maskedBody.split("\n").forEach((line, idx) => {
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) headings.push({ level: m[1].length, text: m[2].normalize("NFC").trim(), line: firstLine + idx });
  });
  return headings;
}

export function extractSections(body: string, headings: Heading[], firstLine: number): Record<string, string> {
  const lines = body.split("\n");
  const sections: Record<string, string> = {};
  const h2 = headings.filter((h) => h.level === 2);
  for (const h of h2) {
    const startIdx = h.line - firstLine + 1;
    const next = headings.find((o) => o.line > h.line && o.level <= 2);
    const endIdx = next ? next.line - firstLine : lines.length;
    sections[h.text] = lines.slice(startIdx, endIdx).join("\n").trim();
  }
  return sections;
}

/** Чистая функция: сырой текст файла → структурированный документ. */
export function parseDocument(path: string, raw: string): LoreDocument {
  const normPath = path.normalize("NFC").replace(/\\/g, "/");
  const split = splitFrontmatter(raw);
  const yamlErrors: string[] = [];
  let frontmatter: unknown = null;
  if (split.error) yamlErrors.push(split.error);
  if (split.has && !split.error) {
    const doc = YAML.parseDocument(split.text, { prettyErrors: true });
    for (const e of doc.errors) yamlErrors.push(e.message.split("\n")[0]);
    if (doc.errors.length === 0) frontmatter = doc.toJS();
  }
  const firstLine = split.bodyOffsetLines + 1;
  const masked = maskCode(split.body);
  const headings = extractHeadings(masked, firstLine);
  const fileName = (normPath.split("/").pop() ?? normPath).replace(/\.md$/i, "");
  const parts = normPath.split("/");
  return {
    path: normPath,
    fileName,
    folder: parts[0] === "universe" && parts.length > 2 ? parts[1] : "",
    kind: classifyPath(normPath),
    hasFrontmatter: split.has,
    frontmatter,
    yamlErrors,
    body: split.body,
    bodyStartLine: firstLine,
    links: extractLinks(masked, firstLine),
    headings,
    sections: extractSections(split.body, headings, firstLine),
  };
}
