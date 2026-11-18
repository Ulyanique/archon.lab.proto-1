import { Marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { REGISTRY_PATH } from "@archon/lore-indexer";
import type { KnowledgeBase, LoreDocument } from "@archon/lore-parser";
import { isPublishedStatus } from "@archon/lore-schema";

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Детерминированный ASCII-слаг для кириллических имён файлов. */
export function slugify(input: string): string {
  return input
    .normalize("NFC")
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const entityHref = (id: string) => `/entity/${id}`;
export const metaHref = (doc: LoreDocument) => `/universe/${slugify(doc.fileName)}`;

/** Общий формат id заголовков и ссылок на них; префикс избегает конфликтов с DOM. */
export function headingId(text: string): string {
  return `section-${text.normalize("NFC").toLowerCase().trim().replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "") || "heading"}`;
}

function fragment(text: string, doc: LoreDocument): string {
  let heading = text;
  try { heading = decodeURIComponent(text); } catch { /* сохраняем исходный текст */ }
  // Первый H1 выносится в заголовок страницы и в теле отсутствует.
  const first = doc.headings[0];
  if (/^\s*# .*\n?/.test(doc.body) && first?.level === 1 && headingId(first.text) === headingId(heading)) return "#";
  return `#${encodeURIComponent(headingId(heading))}`;
}

/** Ссылка на документ внутри сайта либо null, если документ не публикуется. */
export function hrefForDoc(kb: KnowledgeBase, doc: LoreDocument): string | null {
  if (doc.kind === "meta") return doc.path === REGISTRY_PATH ? null : metaHref(doc);
  if (doc.kind === "entity") {
    const entity = kb.entities.find((e) => e.doc === doc);
    return entity && isPublishedStatus(entity.fm.status) ? entityHref(entity.id) : null;
  }
  return null;
}

const WIKI_RE = /(!?)\[\[([^\[\]\n]+?)\]\]/g;
const MD_RE = /(!?)\[([^\]\n]*)\]\((?:<([^>\n]+)>|([^)\s]+))(?:\s+"[^"]*")?\)/g;
const EXTERNAL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i; // схема, абсолютный путь сайта или якорь

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unlinked = (text: string) => `<span class="unlinked" title="Не опубликовано или отсутствует на сайте">${escapeHtml(text)}</span>`;

function rewriteLinks(kb: KnowledgeBase, doc: LoreDocument, text: string): string {
  // Не трогаем код: режем текст на сегменты (чётные — обычный текст).
  const parts = text.split(/(^```[^\n]*\n[\s\S]*?^```[^\n]*$|`[^`\n]*`)/gm);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part
        .replace(WIKI_RE, (_m, bang: string, inner: string) => {
          if (bang) return ""; // вложения пока не поддерживаются (нет медиа)
          const [targetPart, ...alias] = inner.replace(/\\\|/g, "|").split("|");
          const [target, ...headingParts] = targetPart.split("#");
          const heading = headingParts.join("#").trim();
          const label = (alias.join("|") || target || heading).trim();
          if (!target.trim()) return heading ? `<a href="${fragment(heading, doc)}">${escapeHtml(label)}</a>` : escapeHtml(label);
          const res = kb.resolveWiki(target.trim());
          const href = res.status === "ok" ? hrefForDoc(kb, res.doc) : null;
          return href && res.status === "ok" ? `[${label}](${href}${heading ? fragment(heading, res.doc) : ""})` : unlinked(label);
        })
        .replace(MD_RE, (m, bang: string, label: string, angled?: string, plain?: string) => {
          const raw = (angled ?? plain ?? "").trim();
          if (bang || !raw) return m;
          if (raw.startsWith("#")) return `[${label}](${fragment(raw.slice(1), doc)})`;
          if (EXTERNAL_RE.test(raw)) return m;
          const [pathAndQuery, ...headingParts] = raw.split("#");
          const path = kb.resolveRelative(doc.path, pathAndQuery.split("?")[0]);
          const target = kb.documents.find((d) => d.path === path);
          const href = target ? hrefForDoc(kb, target) : null;
          const heading = headingParts.join("#");
          return href && target ? `[${label}](${href}${heading ? fragment(heading, target) : ""})` : unlinked(label || raw);
        });
    })
    .join("");
}

/** Удаляет первый H1 (страница выводит заголовок сама). */
function stripLeadingH1(body: string): string {
  return body.replace(/^\s*# .*\n?/, "");
}

export function renderDocument(kb: KnowledgeBase, doc: LoreDocument): string {
  const md = rewriteLinks(kb, doc, stripLeadingH1(doc.body));
  const usedIds = new Set<string>();
  const marked = new Marked();
  marked.use({ renderer: {
    heading({ text, tokens, depth }) {
      const base = headingId(text);
      let id = base;
      for (let n = 1; usedIds.has(id); n++) id = `${base}-${n}`;
      usedIds.add(id);
      return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    },
  } });
  const html = marked.parse(md, { async: false, gfm: true });
  // Markdown может содержать произвольный HTML, поэтому фильтруем готовый результат.
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags,
    allowedAttributes: { a: ["href", "title"], span: ["class", "title"], code: ["class"], h1: ["id"], h2: ["id"], h3: ["id"], h4: ["id"], h5: ["id"], h6: ["id"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
  });
}

export function documentTitle(doc: LoreDocument): string {
  return doc.headings.find((h) => h.level === 1)?.text ?? doc.fileName;
}
