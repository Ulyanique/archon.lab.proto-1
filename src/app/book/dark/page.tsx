import type { Metadata } from "next";
import Link from "next/link";
import { getDarkOpening } from "@/lib/book";
import { getKb } from "@/lib/lore";
import { renderDocument } from "@/lib/markdown";

export const metadata: Metadata = { title: "Темнота — начало книги" };
export default function DarkOpeningPage() {
  const opening = getDarkOpening();
  return <div className="book-page">
    <p className="eyebrow"><Link href="/book">Книга</Link> {"//"} <b>новое начало</b></p>
    <header className="book-header"><div><p className="section-kicker">АРХОН / ПРОЗА / РАБОЧИЙ ЧЕРНОВИК</p><h1>Темнота<span>.</span></h1><p className="lead">Начало после аварии. Пространство открывается вместе с Харпером.</p></div></header>
    <div className="workshop-notice"><strong>РАБОЧАЯ ВЕРСИЯ / НЕ КАНОН</strong><span>События и персонажи ещё разрабатываются. Остальные варианты начала сохранены отдельно.</span></div>
    <article className="book-chapter"><div className="book-prose prose" dangerouslySetInnerHTML={{ __html: renderDocument(getKb(), opening.doc) }} /></article>
    <aside className="book-after"><div><p className="section-kicker">СЦЕНЫ КАК ПАЗЛ</p><h2>Собрать свою версию</h2><p>Новое начало можно включить отдельно; переходы к другим сценам ещё не написаны.</p></div><Link href="/book#assembly-title">К СБОРКЕ ↗</Link></aside>
  </div>;
}
