import type { Metadata } from "next";
import Link from "next/link";
import { getBookOpenings } from "@/lib/book";
import { getKb } from "@/lib/lore";
import { renderDocument } from "@/lib/markdown";

export const metadata: Metadata = { title: "Три начала книги" };
export default function BookOpeningsPage() {
  const kb = getKb();
  const openings = getBookOpenings();
  return <div className="book-page openings-page">
    <p className="eyebrow"><Link href="/book">Книга</Link> {"//"} <b>варианты начала</b></p>
    <header className="book-header"><div><p className="section-kicker">ПРОЗА / ТРИ СПОСОБА НАЧАТЬ</p><h1>С чего <span>начать?</span></h1><p className="lead">Три самостоятельных начала одной возможной книги. Сравним не сюжетные планы, а сам текст и ощущение от первой сцены.</p></div><div className="book-index"><span>ВАРИАНТЫ / 03</span>{openings.map((opening) => <a key={opening.id} href={`#${opening.id}`}><b>{opening.title.slice(8, 9)}</b> {opening.title} <b>↓</b></a>)}</div></header>
    <div className="workshop-notice"><strong>АЛЬТЕРНАТИВЫ / НЕ КАНОН</strong><span>Это разные возможные первые сцены, не последовательные главы. Первая глава «Две минуты» сохранена отдельно; выбор не сделан. Сборка, место и продолжение требуют доработки.</span></div>
    {openings.map((opening) => <article className="book-chapter opening-entry" key={opening.id} id={opening.id}><div className="book-chapter-meta"><span>{opening.approach}</span><span>РАБОЧАЯ ПРОЗА</span></div><h2>{opening.title}</h2><p className="opening-summary">{opening.summary}</p><div className="book-prose prose" dangerouslySetInnerHTML={{ __html: renderDocument(kb, opening.doc) }} />{opening.id === "book-opening-lift" && <Link className="opening-assemble" href="/book/lift">ЧИТАТЬ ПРОДОЛЖЕНИЕ ↗</Link>}<Link className="opening-assemble" href="/book#assembly-title">ПЕРЕЙТИ К СБОРКЕ ↗</Link></article>)}
    <aside className="book-after"><div><p className="section-kicker">КАК ЧИТАТЬ СРАВНЕНИЕ</p><h2>Что оставить?</h2><p>Выбирайте не только завязку, но и голос, скорость и то, за кого хочется переживать. Все варианты можно переписать или объединить вручную.</p></div><Link href="/book">К КНИГЕ ↗</Link></aside>
  </div>;
}
