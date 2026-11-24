import Link from "next/link";
import { SECTIONS, STATUS_INFO, type SectionKey, type Status } from "@archon/lore-schema";
import { EntityCard } from "@/components/ui";
import { LinkPending } from "@/components/LinkPending";
import { entitiesInSection, getKb, publishedEntities } from "@/lib/lore";

export default function HomePage() {
  const kb = getKb();
  const published = publishedEntities(kb);
  const count = (s: Status) => published.filter((e) => e.fm.status === s).length;
  const recent = [...published].sort((a, b) => b.fm.updated.localeCompare(a.fm.updated) || a.fm.title.localeCompare(b.fm.title, "ru")).slice(0, 6);
  const sections = (Object.keys(SECTIONS) as SectionKey[]).map((key) => ({ key, ...SECTIONS[key], total: entitiesInSection(key, kb).length }));

  return (
    <div className="home">
      <section className="hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <div className="hero-topline"><span className="signal-dot" /> НЕЗАВИСИМЫЙ АРХИВ ВСЕЛЕННОЙ <span> / 001</span></div>
          <div className="hero-heading">
            <span className="hero-overline">ЧЕЛОВЕК. МАШИНА. ПАМЯТЬ.</span>
            <h1 id="home-title">АРХОН<span className="hero-period">.</span></h1>
            <p className="hero-subtitle">Архив на границе<br />человека и машины.</p>
          </div>
          <div className="hero-bottom">
            <p>Исследуйте мир искусственного разума, человеческой памяти и будущего, которое ещё предстоит понять.</p>
            <div className="hero-actions"><Link className="primary-link" href="/universe">Исследовать вселенную <span aria-hidden="true">↗</span><LinkPending /></Link>
            <Link className="home-studio-link" href="/studio">СТУДИЯ / РАБОТАТЬ НАД МИРОМ ↗</Link></div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-top"><span>ARCHON / RESEARCH ARCHIVE</span><span>FIG. 001</span></div>
          <div className="hero-art-mark"><span>+</span><span>+</span></div>
          <div className="hero-art-bottom"><span>ИССЛЕДОВАТЕЛЬСКИЙ АРХИВ</span><span>ЧЕЛОВЕК / МАШИНА / ПАМЯТЬ</span></div>
        </div>
        <div className="hero-caption"><span>Независимая энциклопедия</span><span>Материалы на стадии исследования</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className="archive-intro" aria-label="Статус архива">
        <div className="archive-intro-label"><span className="signal-dot" /> СОСТОЯНИЕ АРХИВА</div>
        <div className="archive-intro-copy">
          <p>Одна вселенная.<br /><span>Множество историй.</span></p>
          <small>{count("canon") === 0 ? "Ни одна запись пока не утверждена как канон. Исходные сведения дополнены уточнениями владельца; неизвестное остаётся открытым." : "Статус каждой записи показывает, утверждена ли она владельцем как канон."} <Link href="/universe/otkrytye-voprosy">Открытые вопросы ↗</Link></small>
        </div>
        <div className="archive-stats" role="list">
          <div role="listitem"><b>{String(published.length).padStart(2, "0")}</b><span>ЗАПИСЕЙ В АРХИВЕ</span></div>
          <div role="listitem"><b>{String(count("review")).padStart(2, "0")}</b><span>{STATUS_INFO.review.label.toUpperCase()}</span></div>
          <div role="listitem"><b>{String(count("unresolved")).padStart(2, "0")}</b><span>ТРЕБУЮТ УТОЧНЕНИЯ</span></div>
        </div>
      </section>

      <section className="home-section" aria-labelledby="directory-title">
        <div className="home-section-heading">
          <div><p className="section-kicker"><span>01 / ИССЛЕДОВАТЬ</span><span className="section-kicker-line" /></p><h2 id="directory-title">УСТРОЙСТВО <span>МИРА</span></h2></div>
          <p>Персонажи, места, технологии и события — нити единой вселенной.</p>
        </div>
        <div className="directory-grid">
          {sections.map((s, i) => (
            <Link key={s.key} href={`/${s.key}`} className="directory-card">
              <LinkPending /><div className="directory-top"><span>РАЗДЕЛ / {String(i + 1).padStart(2, "0")}</span><span>{String(s.total).padStart(2, "0")} ЗАПИСЕЙ</span></div>
              <div><h3>{s.title}</h3><p>{s.description}</p></div>
              <div className="directory-bottom"><span>ОТКРЫТЬ РАЗДЕЛ</span><span aria-hidden="true">↗</span></div>
            </Link>
          ))}
          <Link href="/timeline" className="directory-card directory-card-accent">
            <LinkPending /><div className="directory-top"><span>ВРЕМЯ / 08</span><span>ХРОНОЛОГИЯ</span></div><div><h3>Хронология</h3><p>События с известными и неизвестными датами. Без вымышленного порядка.</p></div><div className="directory-bottom"><span>ОТКРЫТЬ ХРОНОЛОГИЮ</span><span aria-hidden="true">↗</span></div>
          </Link>
          <Link href="/connections" className="directory-card">
            <LinkPending /><div className="directory-top"><span>ГРАФ / 09</span><span>СВЯЗИ</span></div><div><h3>Связи</h3><p>Нити, которые соединяют персонажей, места и события.</p></div><div className="directory-bottom"><span>ОТКРЫТЬ СВЯЗИ</span><span aria-hidden="true">↗</span></div>
          </Link>
        </div>
      </section>

      <section className="workshop-cta" aria-label="Мастерская вселенной">
        <div><p className="section-kicker">МАСТЕРСКАЯ / МИР В РАЗРАБОТКЕ</p><h2>ИДЕИ, ИЗ КОТОРЫХ<br />РАСТЁТ ВСЕЛЕННАЯ<span>.</span></h2><p>Гипотезы и визуальные исследования открыты для обсуждения. Ничего из этого не становится каноном автоматически.</p></div>
        <div className="workshop-cta-links"><Link href="/hypotheses"><LinkPending /><span>01 / ГИПОТЕЗЫ</span><b>Исследовать идеи</b><span>↗</span></Link><Link href="/concept-art"><LinkPending /><span>02 / КОНЦЕПТ-АРТ</span><b>Смотреть образы</b><span>↗</span></Link></div>
      </section>

      <section className="home-section recent-section" aria-labelledby="recent-title">
        <div className="home-section-heading">
          <div><p className="section-kicker"><span>02 / АРХИВ</span><span className="section-kicker-line" /></p><h2 id="recent-title">ПОСЛЕДНИЕ <span>ЗАПИСИ</span></h2></div>
          <Link href="/search" className="text-link">ВСЕ ЗАПИСИ / ПОИСК <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="grid">
          {recent.map((e) => <EntityCard key={e.id} item={{ id: e.id, title: e.fm.title, type: e.fm.type, status: e.fm.status, summary: e.fm.summary }} />)}
        </div>
      </section>
      <div className="home-end"><span>ARCHON UNIVERSE / ARCHIVE</span><span>КОНЕЦ КАТАЛОГА — НАЧАЛО ИСТОРИИ</span><span>001 — ∞</span></div>
    </div>
  );
}
