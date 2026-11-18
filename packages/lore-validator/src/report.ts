import { extractEdges, type KnowledgeBase } from "@archon/lore-parser";
import { STATUS_INFO, TYPE_INFO, type Status } from "@archon/lore-schema";
import { summarize, type Diagnostic } from "./validate";

export interface ReportItem {
  id?: string;
  path: string;
  text: string;
}

export interface HeuristicGroup {
  code: string;
  title: string;
  description: string;
  items: ReportItem[];
}

export interface DeclaredUnknowns {
  id: string;
  title: string;
  path: string;
  status: Status;
  items: string[];
}

export interface ContradictionReport {
  counts: { entities: number; byStatus: Record<string, number>; byType: Record<string, number>; errors: number; warnings: number };
  declared: DeclaredUnknowns[];
  heuristics: HeuristicGroup[];
}

const bullets = (text: string): string[] =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => l.replace(/^[-*]\s+/, ""))
    .filter((l) => l.replace(/[—\-\s]/g, "") !== "");

/**
 * Отчёт о возможных противоречиях и пробелах. Это подсказки для человека и Continuity Auditor:
 * отчёт ничего не меняет и не является доказательством противоречия.
 */
export function buildReport(kb: KnowledgeBase, diagnostics: Diagnostic[]): ContradictionReport {
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const e of kb.entities) {
    byStatus[e.fm.status] = (byStatus[e.fm.status] ?? 0) + 1;
    byType[e.fm.type] = (byType[e.fm.type] ?? 0) + 1;
  }
  const { errors, warnings } = summarize(diagnostics);

  const declared: DeclaredUnknowns[] = kb.entities
    .map((e) => ({
      id: e.id,
      title: e.fm.title,
      path: e.doc.path,
      status: e.fm.status,
      items: bullets(e.doc.sections["Противоречия и неизвестные сведения"] ?? ""),
    }))
    .filter((d) => d.items.length > 0);

  const edges = extractEdges(kb);
  const title = (id: string) => kb.byId.get(id)?.fm.title ?? id;
  const heuristics: HeuristicGroup[] = [];

  // 1. Канон опирается на не-канон; любые ссылки на deprecated.
  const dependency: ReportItem[] = [];
  for (const edge of edges) {
    const s = kb.byId.get(edge.source)!;
    const t = kb.byId.get(edge.target)!;
    if (s.fm.status === "canon" && t.fm.status !== "canon") {
      dependency.push({ id: s.id, path: s.doc.path, text: `канон «${s.fm.title}» → «${t.fm.title}» (status=${t.fm.status}), связь ${edge.type}` });
    } else if (t.fm.status === "deprecated" && s.fm.status !== "deprecated") {
      dependency.push({ id: s.id, path: s.doc.path, text: `«${s.fm.title}» ссылается на устаревшую «${t.fm.title}» (${edge.type})` });
    }
  }
  heuristics.push({ code: "STATUS-DEPENDENCY", title: "Опора на неутверждённое или устаревшее", description: "Каноническая сущность связана с не-канонической, либо кто-то ссылается на deprecated.", items: dependency });

  // 2. Односторонние связи.
  const pairs = new Set(edges.map((e) => `${e.source}|${e.target}`));
  const oneWay: ReportItem[] = [];
  for (const edge of edges) {
    if (edge.origin !== "frontmatter" || edge.type !== "related") continue;
    if (!pairs.has(`${edge.target}|${edge.source}`)) {
      oneWay.push({ id: edge.source, path: kb.byId.get(edge.source)!.doc.path, text: `«${title(edge.source)}» → «${title(edge.target)}» (related), обратной ссылки нет` });
    }
  }
  heuristics.push({ code: "ONE-WAY-LINK", title: "Односторонние связи", description: "A указывает на B как на связанную сущность, B не упоминает A. Не ошибка; проверьте, не потеряна ли связь.", items: oneWay });

  // 3. События без даты / без порядка.
  const eventItems: ReportItem[] = [];
  for (const e of kb.entities.filter((x) => x.fm.type === "event")) {
    const d = e.fm.date;
    const parts: string[] = [];
    if (!d || d.precision === "unknown") parts.push("дата неизвестна");
    if (e.fm.after.length === 0) parts.push("порядок относительно других событий не задан");
    if (parts.length) eventItems.push({ id: e.id, path: e.doc.path, text: `«${e.fm.title}»: ${parts.join("; ")}` });
  }
  heuristics.push({ code: "EVENT-ORDER", title: "События с неопределённой датой/последовательностью", description: "Глобальная хронология не придумывается; эти события не могут быть упорядочены автоматически.", items: eventItems });

  // 4. Научный статус.
  const science: ReportItem[] = kb.entities
    .filter((e) => e.fm.type === "technology" && (!e.fm.science_status || e.fm.science_status === "unassessed" || e.fm.science_status === "unexplained"))
    .map((e) => ({ id: e.id, path: e.doc.path, text: `«${e.fm.title}»: science_status=${e.fm.science_status ?? "не задан"} — требуется оценка Science Research Agent` }));
  heuristics.push({ code: "SCIENCE-UNASSESSED", title: "Технологии без научной оценки", description: "ТЗ §5: нужно различать реальное, теоретически возможное, допущение и необъяснённое.", items: science });

  // 5. Изолированные сущности.
  const connected = new Set<string>();
  for (const e of edges) {
    connected.add(e.source);
    connected.add(e.target);
  }
  const isolated: ReportItem[] = kb.entities
    .filter((e) => !connected.has(e.id))
    .map((e) => ({ id: e.id, path: e.doc.path, text: `«${e.fm.title}» не связана ни с одной сущностью` }));
  heuristics.push({ code: "ISOLATED", title: "Изолированные сущности", description: "Нет ни входящих, ни исходящих связей.", items: isolated });

  // 6. Сводка по канону.
  const canonCount = byStatus.canon ?? 0;
  heuristics.push({
    code: "CANON-COVERAGE",
    title: "Покрытие каноном",
    description: "Сколько сущностей утверждено владельцем.",
    items: [{ path: "universe/", text: canonCount === 0 ? "Ни одна сущность пока не имеет status=canon: все сведения ждут утверждения владельцем." : `canon: ${canonCount} из ${kb.entities.length}` }],
  });

  return { counts: { entities: kb.entities.length, byStatus, byType, errors, warnings }, declared, heuristics };
}

export function renderReportMarkdown(report: ContradictionReport, diagnostics: Diagnostic[]): string {
  const L: string[] = [];
  L.push("# Отчёт о противоречиях и пробелах", "");
  L.push("> Сгенерировано `npx tsx scripts/lore.ts report`. Отчёт состоит из подсказок и **не изменяет канон**. Эвристики могут давать ложные срабатывания.", "");
  L.push("## Сводка", "");
  L.push(`- Сущностей: **${report.counts.entities}**; ошибок валидации: **${report.counts.errors}**; предупреждений: **${report.counts.warnings}**`);
  L.push(`- По статусам: ${Object.entries(report.counts.byStatus).map(([k, v]) => `${STATUS_INFO[k as Status].label} (${k}) — ${v}`).join("; ") || "—"}`);
  L.push(`- По типам: ${Object.entries(report.counts.byType).map(([k, v]) => `${TYPE_INFO[k as keyof typeof TYPE_INFO].label} — ${v}`).join("; ") || "—"}`, "");

  L.push("## Явно зафиксированные неизвестные сведения и противоречия", "");
  L.push("Берутся из раздела «Противоречия и неизвестные сведения» каждой статьи.", "");
  if (report.declared.length === 0) L.push("_Нет._", "");
  for (const d of report.declared) {
    L.push(`### ${d.title} (\`${d.id}\`, ${d.status}) — ${d.items.length}`, "");
    for (const item of d.items) L.push(`- ${item}`);
    L.push("");
  }

  L.push("## Эвристические наблюдения", "");
  for (const g of report.heuristics) {
    L.push(`### ${g.title} — ${g.items.length}`, "", `_${g.description}_ (\`${g.code}\`)`, "");
    if (g.items.length === 0) L.push("Не обнаружено.", "");
    else {
      for (const i of g.items) L.push(`- ${i.text} — \`${i.path}\``);
      L.push("");
    }
  }

  L.push("## Диагностика валидатора", "");
  if (diagnostics.length === 0) L.push("Замечаний нет.", "");
  else {
    for (const d of diagnostics) L.push(`- **${d.severity}** \`${d.code}\` ${d.message} — \`${d.path}${d.line ? `:${d.line}` : ""}\``);
    L.push("");
  }
  return L.join("\n");
}
