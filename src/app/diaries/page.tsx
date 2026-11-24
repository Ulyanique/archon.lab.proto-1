import type { Metadata } from "next";
import Link from "next/link";
import { getDiaries } from "@/lib/diaries";
import { getStories } from "@/lib/stories";
import { getHypotheses } from "@/lib/workshop";

export const metadata: Metadata = { title: "Дневники Харпера" };
const kinds = { observation: "НАБЛЮДЕНИЕ", work: "РАБОЧАЯ ЗАПИСЬ", mystery: "ЗАГАДКА" } as const;
const media = { paper: "БУМАГА", digital: "КОМПЬЮТЕР" } as const;

export default function DiariesPage() {
  const entries = getDiaries();
  const stories = new Map(getStories().map((item) => [item.id, item]));
  const hypotheses = new Map(getHypotheses().map((item) => [item.id, item]));
  return <div className="diaries-page">
    <p className="eyebrow"><Link href="/studio">Студия</Link> {"//"} <Link href="/entity/character-alexei-harper">Алексей Харпер</Link> {"//"} <b>дневники</b></p>
    <header className="diaries-header" id="top-diaries"><div><p className="section-kicker">ЛИЧНЫЕ ЗАПИСИ / ГОЛОС ПЕРСОНАЖА</p><h1 className="page-title">Дневники<br />Харпера<span>.</span></h1><p className="lead">Наблюдения, смешные случаи и рабочие загадки — мир глазами человека, который тоже не всегда прав.</p></div><div className="diaries-index"><span>СОДЕРЖАНИЕ / {String(entries.length).padStart(2, "0")}</span><ol>{entries.map((entry, index) => <li key={entry.id}><Link href={`#${entry.id}`}><small>{String(index + 1).padStart(2, "0")}</small>{entry.title}<b>↓</b></Link></li>)}</ol></div></header>
    <div className="workshop-notice"><strong>ХУДОЖЕСТВЕННЫЙ ЧЕРНОВИК / НЕ КАНОН</strong><span>Слова принадлежат условному рассказчику, а не являются объективной энциклопедией. Порядок редакционный, время и хронология не установлены. Записи публичны согласно настройкам развёртывания.</span></div>
    <p className="story-note">С первыми записями тематически связана <Link href="/book">первая глава книги ↗</Link>; место дневников в произведении пока не выбрано.</p>
    <div className="diaries-list">{entries.map((entry, index) => <article className="diary-entry" id={entry.id} key={entry.id} aria-labelledby={`${entry.id}-title`}>
      <div className="diary-margin"><span>ЗАПИСЬ / {String(index + 1).padStart(2, "0")}</span><span>{entry.id}</span><span>{media[entry.medium]}<br />{kinds[entry.kind]}</span></div>
      <div className="diary-content"><div className="diary-top"><span>АРХИВ ЛИЧНЫХ НАБЛЮДЕНИЙ</span><span>{media[entry.medium]} / {kinds[entry.kind]}</span></div><h2 id={`${entry.id}-title`}>{entry.title}</h2><p className="diary-time">{entry.timeNote}</p><div className="diary-text">{entry.paragraphs.map((paragraph, i) => <p key={`${entry.id}-${i}`}>{paragraph}</p>)}</div><div className="diary-footer"><span>АЛЕКСЕЙ ХАРПЕР / РАБОЧИЙ ГОЛОС</span><a href="#top-diaries">К СОДЕРЖАНИЮ ↑</a></div>
      {(entry.hypothesisIds.length > 0 || entry.storyIds.length > 0) && <aside className="diary-context" aria-label={`Контекст: ${entry.title}`}><h3>Для дальнейшей работы</h3><p>Тематические указатели, не подтверждение событий и не место записи в сюжете.</p><div>{entry.hypothesisIds.map((id) => <Link href={`/hypotheses/${id}`} key={id}>{id} / {hypotheses.get(id)?.title} ↗</Link>)}{entry.storyIds.map((id) => <Link href={`/stories/${id}`} key={id}>История / {stories.get(id)?.title} ↗</Link>)}</div></aside>}</div>
    </article>)}</div>
  </div>;
}
