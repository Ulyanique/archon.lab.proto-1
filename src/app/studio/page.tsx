import type { Metadata } from "next";
import Link from "next/link";
import { getKb, publishedEntities } from "@/lib/lore";
import { getDraftConcepts, getHypotheses } from "@/lib/workshop";
import { getStories } from "@/lib/stories";
import { WORLD_DOMAINS } from "@/lib/studio";

export const metadata: Metadata = { title: "Студия" };

export default function StudioPage() {
  const kb = getKb();
  const entities = publishedEntities(kb);
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  const hypotheses = getHypotheses();
  const hypothesisById = new Map(hypotheses.map((item) => [item.id, item]));
  const concepts = getDraftConcepts();
  const storyEntry = getStories().find((item) => item.id === "story-scrypt-request");
  const story = concepts.find((item) => item.title === "Scrypt — закрытое поручение");
  const suggested = ["H-014", "H-027", "H-028", "H-029", "H-030"].flatMap((id) => { const item = hypothesisById.get(id); return item ? [item] : []; });

  return <div className="studio">
    <header className="studio-intro">
      <div><p className="section-kicker">ARCHON / WORLD & STORY STUDIO</p><h1>Студия <span>Архона.</span></h1><p className="studio-lead">Пространство для создания связной вселенной, персонажей и историй — от первого вопроса до сцены.</p></div>
      <div className="studio-intro-side"><span>РАБОЧЕЕ ПРОСТРАНСТВО / 001</span><p>Мир развивается вместе с твоими решениями. Гипотезы, черновики и визуальные исследования не становятся каноном автоматически.</p><a href="#studio-focus">ПРОДОЛЖИТЬ РАБОТУ ↓</a></div>
    </header>
    <div className="studio-stats" aria-label="Материалы проекта"><div><b>{entities.length}</b><span>ПУБЛИЧНЫХ ЗАПИСЕЙ</span></div><div><b>{hypotheses.length}</b><span>ГИПОТЕЗ В РЕЕСТРЕ</span></div><div><b>{concepts.length}</b><span>РАБОЧИХ КОНЦЕПЦИЙ</span></div><Link href="/search">НАЙТИ В АРХИВЕ ↗</Link></div>
    <section className="studio-focus" id="studio-focus" aria-labelledby="studio-focus-title">
      <div className="studio-section-head"><div><p className="section-kicker">01 / ТЕКУЩЕЕ НАПРАВЛЕНИЕ</p><h2 id="studio-focus-title">От мира к истории</h2></div><p>Первый рабочий пример, а не утверждённый сюжет. Его можно изменить или заменить.</p></div>
      <div className="studio-focus-grid"><div className="studio-story"><p className="studio-tag">СЮЖЕТНЫЙ НАБРОСОК / НЕ КАНОН</p><h3>Scrypt: закрытое поручение</h3><p>Человек ищет возможное доказательство в чужой закрытой записи. Как сопоставить право на приватность с интересами того, кто просит доступ?</p><div className="studio-story-flow"><span>МИР</span><span>КОНФЛИКТ</span><span>РОЛИ</span><span>СИНОПСИС</span><span>СЦЕНА</span></div>{storyEntry && <><Link href={`/stories/${storyEntry.id}`} className="studio-action">ОТКРЫТЬ КАРТОЧКУ ИСТОРИИ ↗</Link><br /></>}{story ? <Link href={`/concept-drafts/${story.slug}`} className="studio-action">ОТКРЫТЬ РАБОЧИЙ НАБРОСОК ↗</Link> : <Link href="/concepts" className="studio-action">ОТКРЫТЬ КОНЦЕПЦИИ ↗</Link>}</div>
      <div className="studio-decisions"><p className="studio-tag">ОСНОВА ДЛЯ ОБСУЖДЕНИЯ</p><h3>Решения и зависимости</h3><p>Предложения оцениваются отдельно; принятие одной идеи не принимает другие.</p><ul>{suggested.map((item) => <li key={item.id}><Link href={`/hypotheses/${item.id}`}><b>{item.id}</b><span>{item.title}</span><span aria-hidden="true">↗</span></Link><small>{item.dependencies.length ? `Требует: ${item.dependencies.join(", ")}` : "Без обязательных гипотез"} · {item.status}</small></li>)}</ul><Link href="/hypotheses#decision-drafts" className="studio-text-link">ЛИЧНЫЕ ЧЕРНОВИКИ РЕШЕНИЙ ↗</Link></div></div>
    </section>
    <section className="studio-domains" id="world-domains" aria-labelledby="studio-domains-title"><div className="studio-section-head"><div><p className="section-kicker">02 / КАРТА МИРА</p><h2 id="studio-domains-title">Сферы и вопросы</h2></div><p>Редакторские точки входа, не оценка полноты мира. Связи и последствия нужно рассматривать между сферами.</p></div>
      <div className="studio-domain-grid">{WORLD_DOMAINS.map((domain, index) => <article className="studio-domain" key={domain.id}><div className="studio-domain-top"><span>ОБЛАСТЬ / {String(index + 1).padStart(2, "0")}</span><span>ВОПРОС ОТКРЫТ</span></div><h3>{domain.title}</h3><p className="studio-domain-focus">{domain.focus}</p><p>{domain.question}</p><div className="studio-domain-links">{domain.entityIds.map((id) => { const entity = byId.get(id); return entity ? <Link href={`/entity/${id}`} key={id}>{entity.fm.title} ↗</Link> : null; })}{domain.hypothesisIds.map((id) => hypothesisById.has(id) ? <Link href={`/hypotheses/${id}`} key={id}>{id} / гипотеза ↗</Link> : null)}</div></article>)}</div>
    </section>
    <section className="studio-tools" aria-labelledby="studio-tools-title"><div><p className="section-kicker">03 / РАБОЧИЕ ИНСТРУМЕНТЫ</p><h2 id="studio-tools-title">Исследовать и проверять</h2><p>Связи помогают обнаружить вопросы, но не доказывают непротиворечивость мира.</p></div><div className="studio-tools-list"><Link href="/universe/otkrytye-voprosy"><b>Открытые вопросы</b><span>Пробелы и решения владельца ↗</span></Link><Link href="/studio/continuity"><b>Проверка связей историй</b><span>Явные зависимости и несовместимости ↗</span></Link><Link href="/connections"><b>Граф архива</b><span>Опубликованные записи и связи ↗</span></Link><Link href="/hypotheses#hypothesis-graph"><b>Карта гипотез</b><span>Зависимости и несовместимые варианты ↗</span></Link><Link href="/timeline"><b>Хронология</b><span>События с известными и неизвестными датами ↗</span></Link><Link href="/concept-drafts/issledovanie-nachala-knigi"><b>Исследование начала</b><span>Источники, разбор и новая редакционная стратегия ↗</span></Link><Link href="/concept-drafts/harper-i-avariya-novaya-tochka-vhoda"><b>Харпер и авария</b><span>Герой, начало и дальняя дуга Элеона ↗</span></Link><Link href="/concept-drafts/plan-trilogii"><b>План трилогии</b><span>Структура, тайны и открытые решения ↗</span></Link><Link href="/inspiration"><b>Источники вдохновения</b><span>Оригиналы и творческие ориентиры ↗</span></Link><Link href="/book"><b>Книга Архона</b><span>Читать первый черновик главы ↗</span></Link><Link href="/diaries"><b>Дневники Харпера</b><span>Голос персонажа и сюжетные фрагменты ↗</span></Link><Link href="/stories"><b>Истории и сцены</b><span>Рабочие сюжеты и вопросы ↗</span></Link><Link href="/concepts"><b>Все концепции</b><span>Публичные рабочие материалы ↗</span></Link></div></section>
    <p className="studio-privacy">Эта панель не ограничивает доступ к сайту. Черновики оценок хранятся в текущем браузере и не синхронизируются; остальные опубликованные материалы доступны согласно настройкам развёртывания.</p>
  </div>;
}
