import type { Metadata } from "next";
import Link from "next/link";
import { getBookChapter, getBookFragments, getBookOpenings, getLiftContinuation, getArchiveScene, getDarkOpening } from "@/lib/book";
import { BookAssembly } from "@/components/BookAssembly";
import { getDiaries } from "@/lib/diaries";
import { getKb } from "@/lib/lore";
import { renderDocument } from "@/lib/markdown";

export const metadata: Metadata = { title: "Архон — первая глава" };
export default function BookPage() {
  const chapter = getBookChapter();
  const kb = getKb();
  const pieces = getBookFragments().map((piece) => ({ id: piece.id, title: piece.title, kind: "ПРОЗА", includedByDefault: true, html: renderDocument(kb, { ...chapter.doc, body: piece.body }) }));
  const diary = getDiaries().find((entry) => entry.id === "diary-harper-record-003");
  if (diary) pieces.push({ id: diary.id, title: `Дневник: ${diary.title}`, kind: "ДНЕВНИК / ВАРИАНТ", includedByDefault: false, html: renderDocument(kb, { ...chapter.doc, body: diary.paragraphs.join("\n\n") }) });
  for (const opening of getBookOpenings()) pieces.push({ id: opening.id, title: opening.title, kind: "АЛЬТЕРНАТИВНОЕ НАЧАЛО", includedByDefault: false, html: renderDocument(kb, opening.doc) });
  const continuation = getLiftContinuation();
  pieces.push({ id: continuation.id, title: continuation.title, kind: "ПРОДОЛЖЕНИЕ / ЛИФТ", includedByDefault: false, html: renderDocument(kb, continuation.doc) });
  const archive = getArchiveScene();
  pieces.push({ id: archive.id, title: archive.title, kind: "ПРОДОЛЖЕНИЕ / ЛИФТ", includedByDefault: false, html: renderDocument(kb, archive.doc) });
  const dark = getDarkOpening();
  pieces.push({ id: dark.id, title: dark.title, kind: "НОВОЕ НАЧАЛО / АВАРИЯ", includedByDefault: false, html: renderDocument(kb, dark.doc) });
  return <div className="book-page">
    <p className="eyebrow"><Link href="/studio">Студия</Link> {"//"} <b>книга</b></p>
    <header className="book-header"><div><p className="section-kicker">АРХОН / ПРОЗА / ПЕРВЫЙ ЧЕРНОВИК</p><h1>Книга <span>Архона.</span></h1><p className="lead">Начало истории Харпера. Не план и не пересказ — текст, который мы можем менять, дополнять и собирать дальше.</p></div><div className="book-index"><span>ТЕКУЩАЯ СБОРКА</span><a href="#chapter-01"><b>01</b> Перейти к тексту <b>↓</b></a></div></header>
    <div className="workshop-notice"><strong>РАБОЧИЙ ТЕКСТ / НЕ КАНОН</strong><span>Название книги, сцены и персонажи этой версии ещё можно менять. Время и место главы в хронологии не установлены. Страница публична согласно настройкам развёртывания.</span></div>
    <aside className="book-opening-promo"><div><p className="section-kicker">НОВОЕ НАЧАЛО / АВАРИЯ</p><h2>Темнота</h2><p>Харпер приходит в себя после аварии и ощупью ищет выход.</p></div><Link href="/book/dark">ЧИТАТЬ НАЧАЛО ↗</Link></aside>
    <aside className="book-opening-promo"><div><p className="section-kicker">ТРИ РАЗНЫХ РИТМА</p><h2>Как начинается история?</h2><p>Лифт, загадочное письмо и тихая сцена в школе — три самостоятельных варианта первой сцены.</p></div><Link href="/book/openings">СРАВНИТЬ НАЧАЛА ↗</Link></aside>
    <aside className="book-opening-promo"><div><p className="section-kicker">ПРОДОЛЖЕНИЕ / РАБОЧАЯ ПРОЗА</p><h2>После лифта</h2><p>Передышка после спасения и новая загадка — отдельный фрагмент для сборки.</p></div><Link href="/book/lift">ЧИТАТЬ ПРОДОЛЖЕНИЕ ↗</Link></aside>
    <BookAssembly pieces={pieces} />
    <aside className="book-after"><div><p className="section-kicker">МАТЕРИАЛ РЯДОМ С ГЛАВОЙ</p><h2>Дневник Харпера</h2><p>Запись «Две минуты» — тематически связанная заготовка. Её место в книге и тождество событий пока не выбраны.</p></div><Link href="/diaries#diary-harper-record-003">ЧИТАТЬ ДНЕВНИК ↗</Link></aside>
  </div>;
}
