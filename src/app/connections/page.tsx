import type { Metadata } from "next";
import Link from "next/link";
import { RELATION_TYPES } from "@archon/lore-schema";
import { allEdgesForSite, getKb } from "@/lib/lore";

export const metadata: Metadata = { title: "Связи" };

export default function ConnectionsPage() {
  const kb = getKb();
  const edges = allEdgesForSite(kb).sort(
    (a, b) => a.type.localeCompare(b.type) || (kb.byId.get(a.source)!.fm.title).localeCompare(kb.byId.get(b.source)!.fm.title, "ru"),
  );
  const byType = new Map<string, number>();
  for (const e of edges) byType.set(e.type, (byType.get(e.type) ?? 0) + 1);

  return (
    <>
      <p className="eyebrow">
        <b>Связи</b> {"//"} {edges.length} связей
      </p>
      <h1 className="page-title">Связи</h1>
      <p className="lead">
        Список связей, автоматически выведенных из frontmatter (<code>related</code>, <code>relations</code>, поля событий) и вики-ссылок в тексте. Интерактивный граф запланирован на следующий этап; данные для него уже строятся командой <code>lore graph</code>.
      </p>
      <div className="tags" style={{ margin: "16px 0 24px" }}>
        {[...byType.entries()].map(([type, n]) => (
          <span key={type} className="tag" title={RELATION_TYPES[type]?.description}>
            {RELATION_TYPES[type]?.label ?? type} · {n}
          </span>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Источник</th>
              <th>Связь</th>
              <th>Цель</th>
              <th>Примечание</th>
            </tr>
          </thead>
          <tbody>
            {edges.map((e) => (
              <tr key={`${e.source}-${e.target}-${e.type}`}>
                <td><Link href={`/entity/${e.source}`}>{kb.byId.get(e.source)!.fm.title}</Link></td>
                <td className="mono" style={{ fontSize: 12 }}>{e.label}</td>
                <td><Link href={`/entity/${e.target}`}>{kb.byId.get(e.target)!.fm.title}</Link></td>
                <td style={{ color: "var(--text-dim)", fontSize: 13 }}>{e.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
