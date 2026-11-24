import type { Entity, KnowledgeBase } from "@archon/lore-parser";
import {
  RELATION_TYPES,
  REQUIRED_SECTIONS,
  STATUS_INFO,
  TYPE_INFO,
  isPublishedStatus,
  normalizeName,
  type EntityType,
} from "@archon/lore-schema";

export type Severity = "error" | "warning" | "info";

export interface Diagnostic {
  severity: Severity;
  code: string;
  message: string;
  path: string;
  line?: number;
  id?: string;
}

/** Каталог кодов диагностики (документирован в docs/architecture/knowledge-base.md). */
export const DIAGNOSTIC_CODES = [
  "FM001", "FM002", "YAML001", "SCHEMA",
  "ID-DUP", "ID-PREFIX", "NAME-DUP",
  "REF-MISSING", "REF-SELF", "REF-TYPE", "REF-UNPUBLISHED", "REL-TYPE",
  "LINK-WIKI", "LINK-AMBIG", "LINK-HEADING", "LINK-FILE",
  "DATE-FORMAT", "DATE-ORDER", "DATE-CYCLE",
  "STATUS-DEPRECATED", "STATUS-CANON-SOURCES",
  "FOLDER-TYPE", "FILE-TITLE", "SECTION-MISSING", "META-SUMMARY",
] as const;

const GREGORIAN_RE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

/** Нижняя/верхняя граница григорианской даты неполной точности в виде YYYY-MM-DD. */
function gregorianBounds(value: string): { lo: string; hi: string } | null {
  const m = GREGORIAN_RE.exec(value);
  if (!m) return null;
  const [, y, mo, d] = m;
  if (mo && (Number(mo) < 1 || Number(mo) > 12)) return null;
  const year = Number(y);
  const month = mo ? Number(mo) : undefined;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = month ? [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] : 31;
  if (d && (Number(d) < 1 || Number(d) > daysInMonth)) return null;
  return { lo: `${y}-${mo ?? "01"}-${d ?? "01"}`, hi: `${y}-${mo ?? "12"}-${d ?? String(daysInMonth).padStart(2, "0")}` };
}

interface DateWindow {
  lo: string;
  hi: string;
}

export function eventWindow(e: Entity): DateWindow | null {
  const d = e.fm.date;
  if (!d || d.calendar !== "gregorian" || d.precision === "unknown" || d.start === undefined) return null;
  const a = gregorianBounds(d.start);
  const b = gregorianBounds(d.end ?? d.start);
  if (!a || !b) return null;
  return { lo: a.lo, hi: b.hi };
}

export function validateKnowledgeBase(kb: KnowledgeBase): Diagnostic[] {
  const out: Diagnostic[] = [];
  const add = (d: Diagnostic) => out.push(d);

  // ---- A. YAML и схема -------------------------------------------------------
  for (const doc of kb.documents) {
    if (doc.kind !== "entity" && doc.yamlErrors.length > 0) {
      for (const msg of doc.yamlErrors) add({ severity: "error", code: "YAML001", message: `YAML: ${msg}`, path: doc.path });
    }
  }
  for (const inv of kb.invalid) {
    const { doc } = inv;
    if (!doc.hasFrontmatter) {
      add({ severity: "error", code: "FM001", message: "нет YAML-frontmatter (файл в universe/ вне 00-meta должен быть сущностью)", path: doc.path });
    } else if (doc.yamlErrors.length > 0) {
      for (const msg of doc.yamlErrors) add({ severity: "error", code: "YAML001", message: `YAML: ${msg}`, path: doc.path });
    } else if (inv.issues.length === 0) {
      add({ severity: "error", code: "FM002", message: "frontmatter должен быть YAML-объектом", path: doc.path });
    } else {
      for (const msg of inv.issues) add({ severity: "error", code: "SCHEMA", message: msg, path: doc.path });
    }
  }

  // ---- B. Идентификаторы и имена --------------------------------------------
  const byIdAll = new Map<string, Entity[]>();
  for (const e of kb.entities) byIdAll.set(e.id, [...(byIdAll.get(e.id) ?? []), e]);
  for (const [id, list] of byIdAll) {
    if (list.length > 1) {
      for (const e of list) {
        add({ severity: "error", code: "ID-DUP", message: `ID \`${id}\` не уникален: ${list.map((x) => x.doc.path).join(", ")}`, path: e.doc.path, id });
      }
    }
  }

  const names = new Map<string, Set<string>>();
  const addName = (n: string, id: string) => {
    const k = normalizeName(n);
    names.set(k, (names.get(k) ?? new Set()).add(id));
  };

  for (const e of kb.entities) {
    const info = TYPE_INFO[e.fm.type];
    const prefix = e.id.slice(0, e.id.indexOf("-"));
    if (!info.idPrefixes.includes(prefix)) {
      add({ severity: "error", code: "ID-PREFIX", message: `префикс ID \`${prefix}\` не подходит типу \`${e.fm.type}\` (допустимо: ${info.idPrefixes.join(", ")})`, path: e.doc.path, id: e.id });
    }
    if (!info.folders.includes(e.doc.folder)) {
      add({ severity: "warning", code: "FOLDER-TYPE", message: `тип \`${e.fm.type}\` обычно хранится в ${info.folders.join(" или ")}, а файл лежит в \`${e.doc.folder}\``, path: e.doc.path, id: e.id });
    }
    if (normalizeName(e.doc.fileName) !== normalizeName(e.fm.title) && !e.fm.aliases.some((a) => normalizeName(a) === normalizeName(e.doc.fileName))) {
      add({ severity: "warning", code: "FILE-TITLE", message: `имя файла «${e.doc.fileName}» не совпадает с title «${e.fm.title}»`, path: e.doc.path, id: e.id });
    }
    addName(e.fm.title, e.id);
    for (const a of e.fm.aliases) addName(a, e.id);
    for (const section of REQUIRED_SECTIONS) {
      if (!(section in e.doc.sections)) {
        add({ severity: "warning", code: "SECTION-MISSING", message: `нет раздела «${section}»`, path: e.doc.path, id: e.id });
      }
    }
    if (!e.fm.summary) add({ severity: "warning", code: "META-SUMMARY", message: "нет поля summary (используется в каталогах и поиске)", path: e.doc.path, id: e.id });
  }
  for (const [name, ids] of names) {
    if (ids.size > 1) {
      const first = kb.byId.get([...ids][0]);
      add({ severity: "error", code: "NAME-DUP", message: `имя/алиас «${name}» принадлежит нескольким сущностям: ${[...ids].join(", ")} (возможный дубликат; вики-ссылки неоднозначны)`, path: first?.doc.path ?? "" });
    }
  }

  // ---- C. Ссылки на ID -------------------------------------------------------
  for (const e of kb.entities) {
    const refs: { field: string; id: string; expect?: EntityType[] }[] = [
      ...e.fm.related.map((id) => ({ field: "related", id })),
      ...e.fm.relations.map((r) => ({ field: `relations[${r.type}]`, id: r.target })),
      ...e.fm.participants.map((id) => ({ field: "participants", id })),
      ...(e.fm.place ? [{ field: "place", id: e.fm.place, expect: ["location"] as EntityType[] }] : []),
      ...e.fm.technologies.map((id) => ({ field: "technologies", id, expect: ["technology"] as EntityType[] })),
      ...e.fm.after.map((id) => ({ field: "after", id, expect: ["event"] as EntityType[] })),
      ...(e.fm.superseded_by ? [{ field: "superseded_by", id: e.fm.superseded_by }] : []),
    ];
    for (const r of e.fm.relations) {
      if (!(r.type in RELATION_TYPES)) {
        add({ severity: "warning", code: "REL-TYPE", message: `тип связи \`${r.type}\` не зарегистрирован в RELATION_TYPES (lore-schema)`, path: e.doc.path, id: e.id });
      }
    }
    for (const ref of refs) {
      const target = kb.byId.get(ref.id);
      if (!target) {
        add({ severity: "error", code: "REF-MISSING", message: `${ref.field} → \`${ref.id}\`: сущность не существует`, path: e.doc.path, id: e.id });
        continue;
      }
      if (target.id === e.id) add({ severity: "warning", code: "REF-SELF", message: `${ref.field}: ссылка на саму себя`, path: e.doc.path, id: e.id });
      if (ref.expect && !ref.expect.includes(target.fm.type)) {
        add({ severity: "warning", code: "REF-TYPE", message: `${ref.field} → \`${ref.id}\` имеет тип \`${target.fm.type}\`, ожидается ${ref.expect.join("/")}`, path: e.doc.path, id: e.id });
      }
      if (isPublishedStatus(e.fm.status) && !isPublishedStatus(target.fm.status)) {
        add({ severity: "warning", code: "REF-UNPUBLISHED", message: `${ref.field} → \`${ref.id}\` (status=${target.fm.status}) не публикуется; на сайте ссылка будет обычным текстом`, path: e.doc.path, id: e.id });
      }
    }
  }

  // ---- D. Ссылки в тексте и на файлы ----------------------------------------
  for (const doc of kb.documents) {
    for (const link of doc.links) {
      if (link.kind === "wiki") {
        if (!link.target) {
          if (link.heading && !doc.headings.some((h) => normalizeName(h.text) === normalizeName(link.heading!))) {
            add({ severity: "warning", code: "LINK-HEADING", message: `нет заголовка «${link.heading}» в этом файле`, path: doc.path, line: link.line });
          }
          continue;
        }
        const res = kb.resolveWiki(link.target);
        if (res.status === "missing") {
          add({ severity: "error", code: "LINK-WIKI", message: `битая ссылка ${link.raw}`, path: doc.path, line: link.line });
        } else if (res.status === "ambiguous") {
          add({ severity: "error", code: "LINK-AMBIG", message: `неоднозначная ссылка ${link.raw}: ${res.docs.map((d) => d.path).join(", ")}`, path: doc.path, line: link.line });
        } else if (link.heading && res.doc.headings && !res.doc.headings.some((h) => normalizeName(h.text) === normalizeName(link.heading!))) {
          add({ severity: "warning", code: "LINK-HEADING", message: `в «${res.doc.fileName}» нет заголовка «${link.heading}» (${link.raw})`, path: doc.path, line: link.line });
        }
      } else {
        const resolved = kb.resolveRelative(doc.path, link.target);
        if (!kb.fileExists(resolved)) {
          add({ severity: "error", code: "LINK-FILE", message: `ссылка на отсутствующий файл: ${link.raw} → ${resolved}`, path: doc.path, line: link.line });
        }
      }
    }
  }

  // ---- E. Семантика статусов -------------------------------------------------
  for (const e of kb.entities) {
    const { status } = e.fm;
    if (status === "deprecated" && !e.fm.superseded_by) {
      add({ severity: "warning", code: "STATUS-DEPRECATED", message: "status=deprecated без superseded_by: укажите замену или оставьте явное пояснение в статье", path: e.doc.path, id: e.id });
    }
    if (status !== "deprecated" && e.fm.superseded_by) {
      add({ severity: "warning", code: "STATUS-DEPRECATED", message: `superseded_by указан, но status=${status} (ожидается deprecated)`, path: e.doc.path, id: e.id });
    }
    if (STATUS_INFO[status].canonical) {
      const src = (e.doc.sections["Источники"] ?? "").replace(/[-—*\s]/g, "");
      if (!src) add({ severity: "warning", code: "STATUS-CANON-SOURCES", message: "канонической сущности нужен непустой раздел «Источники»", path: e.doc.path, id: e.id });
    }
  }

  // ---- F. Время (ТЗ §14) -----------------------------------------------------
  const events = kb.entities.filter((e) => e.fm.type === "event");
  for (const e of events) {
    const d = e.fm.date;
    if (!d || d.calendar !== "gregorian") continue;
    for (const field of ["start", "end"] as const) {
      const v = d[field];
      if (v !== undefined && !gregorianBounds(v)) {
        add({ severity: "error", code: "DATE-FORMAT", message: `date.${field}=«${v}» не соответствует григорианскому формату YYYY[-MM[-DD]]`, path: e.doc.path, id: e.id });
      }
    }
    if (d.start !== undefined && d.end !== undefined) {
      const a = gregorianBounds(d.start);
      const b = gregorianBounds(d.end);
      if (a && b && a.lo > b.hi) add({ severity: "error", code: "DATE-ORDER", message: `начало диапазона (${d.start}) позже конца (${d.end})`, path: e.doc.path, id: e.id });
    }
  }
  for (const e of events) {
    const w = eventWindow(e);
    for (const afterId of e.fm.after) {
      const target = kb.byId.get(afterId);
      const tw = target ? eventWindow(target) : null;
      if (w && tw && w.hi < tw.lo) {
        add({ severity: "error", code: "DATE-ORDER", message: `событие должно быть после \`${afterId}\`, но его даты (${w.lo}…${w.hi}) раньше (${tw.lo}…${tw.hi})`, path: e.doc.path, id: e.id });
      }
    }
  }
  // циклы в after
  const state = new Map<string, 0 | 1 | 2>();
  const reported = new Set<string>();
  const dfs = (id: string, stack: string[]) => {
    state.set(id, 1);
    for (const next of kb.byId.get(id)?.fm.after ?? []) {
      if (!kb.byId.has(next)) continue;
      if (state.get(next) === 1) {
        const cycle = [...stack.slice(stack.indexOf(next)), id, next].join(" → ");
        if (!reported.has(cycle)) {
          reported.add(cycle);
          add({ severity: "error", code: "DATE-CYCLE", message: `цикл в порядке событий (after): ${cycle}`, path: kb.byId.get(id)!.doc.path, id });
        }
      } else if (!state.get(next)) dfs(next, [...stack, id]);
    }
    state.set(id, 2);
  };
  for (const e of events) if (!state.get(e.id)) dfs(e.id, []);

  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  return out.sort((a, b) => order[a.severity] - order[b.severity] || a.path.localeCompare(b.path) || (a.line ?? 0) - (b.line ?? 0));
}

export function summarize(diags: Diagnostic[]) {
  return {
    errors: diags.filter((d) => d.severity === "error").length,
    warnings: diags.filter((d) => d.severity === "warning").length,
    infos: diags.filter((d) => d.severity === "info").length,
  };
}
