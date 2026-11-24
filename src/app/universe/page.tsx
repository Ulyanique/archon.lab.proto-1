import type { Metadata } from "next";
import Link from "next/link";
import { isPublishedStatus } from "@archon/lore-schema";
import { StatusStamp } from "@/components/ui";
import { getKb } from "@/lib/lore";

export const metadata: Metadata = { title: "Вселенная Архон" };

const paths = [
  { id: "concept-archon", label: "01 / ЦЕНТРАЛЬНАЯ ИДЕЯ" },
  { id: "character-eleon", label: "02 / ИСКУССТВЕННЫЙ РАЗУМ" },
  { id: "character-alexei-harper", label: "03 / ЧЕЛОВЕК" },
  { id: "location-limbo", label: "04 / ВИРТУАЛЬНЫЙ МИР" },
];

export default function UniversePage() {
  const kb = getKb();
  const entries = paths.flatMap(({ id, label }) => {
    const entity = kb.byId.get(id);
    return entity && isPublishedStatus(entity.fm.status) ? [{ entity, label }] : [];
  });
  return <div className="universe-overview">
    <header className="universe-intro">
      <p className="eyebrow"><b>ПУТЕВОДИТЕЛЬ</b> {"//"} НАЧАТЬ ЗДЕСЬ</p>
      <h1 className="page-title">Вселенная Архон<span>.</span></h1>
      <p className="universe-statement">Человек создаёт разум.<br /><em>Что разум создаст дальше?</em></p>
      <div className="universe-intro-bottom"><p>Мрачная научная фантастика о человеке, искусственном разуме и их сложных отношениях. Исследуйте записи, связи и вопросы, на которые у этого мира ещё нет окончательных ответов.</p><span>ARCHON / 001 — ∞</span></div>
    </header>
    <div className="universe-notice" role="note"><strong>МИР В РАЗРАБОТКЕ</strong><p>Записи сохраняют свои статусы: материалы на проверке и открытые вопросы ещё не утверждены как канон. Гипотезы и визуальные исследования — отдельные предложения для обсуждения.</p></div>
    <section className="universe-paths" aria-labelledby="paths-title">
      <div className="universe-section-heading"><div><p className="section-kicker">01 / ТОЧКИ ВХОДА</p><h2 id="paths-title">С чего начать</h2></div><p>Четыре нити, ведущие в архив. Откройте запись, чтобы увидеть её источники, связи и неразрешённые вопросы.</p></div>
      <div className="universe-path-grid">{entries.map(({ entity, label }) => <Link href={`/entity/${entity.id}`} className="universe-path" key={entity.id}>
        <div className="universe-path-top"><span>{label}</span><StatusStamp status={entity.fm.status} /></div><h3>{entity.fm.title}</h3><p>{entity.fm.summary}</p><span className="universe-path-link">ОТКРЫТЬ ЗАПИСЬ ↗</span>
      </Link>)}</div>
    </section>
    <section className="universe-next" aria-labelledby="next-title"><div><p className="section-kicker">02 / ДАЛЬШЕ</p><h2 id="next-title">Мир больше одной истории</h2><p>Исследуйте разделы архива или загляните в мастерскую, где идеи ещё ждут своего решения.</p></div><div className="universe-next-links"><Link href="/characters">Персонажи <span>↗</span></Link><Link href="/locations">Локации <span>↗</span></Link><Link href="/connections">Связи архива <span>↗</span></Link><Link href="/hypotheses">Гипотезы / не канон <span>↗</span></Link></div></section>
    <div className="universe-reference"><div><p className="section-kicker">ДЛЯ АВТОРОВ / СПРАВКА</p><h2>Как устроен архив</h2><p>Принципы, стиль, правила канона и открытые вопросы — отдельно от историй мира.</p></div><Link href="/universe/reference">ОТКРЫТЬ СПРАВОЧНЫЕ МАТЕРИАЛЫ ↗</Link></div>
  </div>;
}
