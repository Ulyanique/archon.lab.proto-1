import Link from "next/link";
import { SECTIONS, STATUS_INFO, type SectionKey, type Status } from "@archon/lore-schema";
import { EntityCard } from "@/components/ui";
import { entitiesInSection, getKb, publishedEntities } from "@/lib/lore";

export default function HomePage() {
  const kb = getKb();
  const published = publishedEntities(kb);
  const count = (s: Status) => published.filter((e) => e.fm.status === s).length;
  const recent = [...published].sort((a, b) => b.fm.updated.localeCompare(a.fm.updated) || a.fm.title.localeCompare(b.fm.title, "ru")).slice(0, 6);
  const sections = (Object.keys(SECTIONS) as SectionKey[]).map((key) => ({ key, ...SECTIONS[key], total: entitiesInSection(key, kb).length }));

  return (
    <>
      <section className="hero">
        <p className="eyebrow">
          <b>ARCHON</b> {"//"} исследовательский архив {"//"} доступ: открытый
        </p>
        <h1>Архон</h1>
        <p className="lead">
          Энциклопедия мрачной научно-фантастической вселенной об искусственном разуме, человеке и том, что остаётся между ними. Каждая запись собирается из Markdown-файлов репозитория; статус записи показывает, утверждена ли она владельцем как канон.
        </p>
        <div className="stats" role="list">
          <div role="listitem"><b>{published.length}</b><span>записей</span></div>
          <div role="listitem"><b>{count("canon")}</b><span>{STATUS_INFO.canon.label}</span></div>
          <div role="listitem"><b>{count("review")}</b><span>{STATUS_INFO.review.label}</span></div>
          <div role="listitem"><b>{count("unresolved")}</b><span>{STATUS_INFO.unresolved.label}</span></div>
        </div>
      </section>

      {count("canon") === 0 ? (
        <div className="notice" role="note">
          <strong>Статус архива</strong>
          Ни одна запись пока не утверждена как канон. Все сведения перенесены из технического задания и ждут подтверждения владельцем; неизвестное намеренно оставлено пустым. См. <Link href="/universe/otkrytye-voprosy">открытые вопросы</Link>.
        </div>
      ) : null}

      <div className="section-head">
        <h2>Разделы</h2>
        <Link href="/search" className="mono">Поиск по архиву →</Link>
      </div>
      <div className="grid">
        {sections.map((s) => (
          <Link key={s.key} href={`/${s.key}`} className="card">
            <div className="meta">
              <span>Раздел</span>
              <span>{s.total} зап.</span>
            </div>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
          </Link>
        ))}
        <Link href="/timeline" className="card">
          <div className="meta"><span>Раздел</span><span>—</span></div>
          <h3>Хронология</h3>
          <p>События с точными, приблизительными и неизвестными датами. Порядок не придумывается.</p>
        </Link>
        <Link href="/connections" className="card">
          <div className="meta"><span>Раздел</span><span>—</span></div>
          <h3>Связи</h3>
          <p>Типизированные связи между записями, выведенные из YAML и текста статей.</p>
        </Link>
      </div>

      <div className="section-head">
        <h2>Последние записи</h2>
      </div>
      <div className="grid">
        {recent.map((e) => (
          <EntityCard key={e.id} item={{ id: e.id, title: e.fm.title, type: e.fm.type, status: e.fm.status, summary: e.fm.summary }} />
        ))}
      </div>
    </>
  );
}
