import type { Metadata } from "next";
import Link from "next/link";
import { getBookOpenings, getLiftContinuation, getArchiveScene } from "@/lib/book";
import { getKb } from "@/lib/lore";
import { renderDocument } from "@/lib/markdown";

export const metadata: Metadata = { title: "Лифт — продолжение" };
export default function LiftPage() {
  const kb = getKb();
  const opening = getBookOpenings().find((item) => item.id === "book-opening-lift");
  if (!opening) throw new Error("Не найдено начало с лифтом");
  const continuation = getLiftContinuation();
  const archive = getArchiveScene();
  return <div className="book-page">
    <p className="eyebrow"><Link href="/book">Книга</Link> {"//"} <b>лифт и продолжение</b></p>
    <header className="book-header"><div><p className="section-kicker">АРХОН / ПРОЗА / РАБОЧИЙ ЧЕРНОВИК</p><h1>Лифт <span>и после.</span></h1><p className="lead">Опасность, передышка и вопрос, на который пока нет ответа.</p></div></header>
    <div className="workshop-notice"><strong>ЧЕРНОВИК / НЕ КАНОН</strong><span>Это продолжение варианта с лифтом, а не утверждённая версия книги. Связи с другими началами ещё предстоит решить.</span></div>
    {[{ title: opening.title, doc: opening.doc }, continuation, archive].map((scene) => <article className="book-chapter" key={scene.title}><h2>{scene.title}</h2><div className="book-prose prose" dangerouslySetInnerHTML={{ __html: renderDocument(kb, scene.doc) }} /></article>)}
    <aside className="book-after"><div><p className="section-kicker">СЦЕНЫ КАК ПАЗЛ</p><h2>Собрать свою версию</h2><p>Начало и последующие сцены можно включить по отдельности. Переходы между другими фрагментами требуют ручной доработки.</p></div><Link href="/book#assembly-title">К СБОРКЕ ↗</Link></aside>
  </div>;
}
