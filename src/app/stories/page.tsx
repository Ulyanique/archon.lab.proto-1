import type { Metadata } from "next";
import Link from "next/link";
import { getStories } from "@/lib/stories";

export const metadata: Metadata = { title: "Истории" };

export default function StoriesPage() {
  const stories = getStories();
  return <div className="stories-page">
    <p className="eyebrow"><Link href="/studio">Студия</Link> {"//"} <b>истории</b></p>
    <header className="stories-header"><div><p className="section-kicker">СЮЖЕТНАЯ МАСТЕРСКАЯ</p><h1 className="page-title">Истории</h1><p className="lead">Конфликты, роли и сцены, связанные с миром. Рабочие варианты не утверждают события или персонажей в каноне.</p></div><span>{stories.length} / ПРОЕКТОВ</span></header>
    <div className="workshop-notice"><strong>ЧЕРНОВИКИ / НЕ КАНОН</strong><span>Эти материалы доступны согласно настройкам развёртывания. Здесь пока нет редактора или приватного хранилища.</span></div>
    <div className="stories-grid">{stories.map((story) => <Link key={story.id} href={`/stories/${story.id}`} className="story-card"><div className="story-card-top"><span>{story.id.toUpperCase()}</span><span>В РАЗРАБОТКЕ</span></div><h2>{story.title}</h2><p>{story.summary}</p><div className="story-card-bottom"><span>{story.scenes.length} СЦЕН / ПРОБ</span><span>ОТКРЫТЬ ИСТОРИЮ ↗</span></div></Link>)}</div>
    {stories.length === 0 && <p>Историй пока нет. Рабочие концепции доступны в <Link href="/concepts">мастерской</Link>.</p>}
  </div>;
}
