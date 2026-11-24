import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { diariesForStory, getDiaries } from "@/lib/diaries";
import { getStories } from "@/lib/stories";
import { getKb, publishedEntities } from "@/lib/lore";
import { getHypotheses } from "@/lib/workshop";
import { reviewStory } from "@/lib/story-continuity";
import { StoryReview } from "@/components/StoryReview";
import { headingId } from "@/lib/markdown";

type Props = { params: Promise<{ id: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return getStories().map(({ id }) => ({ id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: getStories().find((story) => story.id === id)?.title ?? "История" };
}
export default async function StoryPage({ params }: Props) {
  const { id } = await params;
  const story = getStories().find((item) => item.id === id);
  if (!story) notFound();
  const entities = new Map(publishedEntities(getKb()).map((item) => [item.id, item]));
  const hypothesisList = getHypotheses();
  const hypotheses = new Map(hypothesisList.map((item) => [item.id, item]));
  const review = reviewStory(story, hypothesisList);
  const diaries = diariesForStory(story.id, getDiaries());
  const conceptHref = `/concept-drafts/${story.conceptSlug}`;
  const refs = (entityIds: string[], hypothesisIds: string[]) => <div className="story-refs">{entityIds.map((ref) => <Link key={ref} href={`/entity/${ref}`}>{entities.get(ref)?.fm.title} ↗</Link>)}{hypothesisIds.map((ref) => <Link key={ref} href={`/hypotheses/${ref}`}>{ref} / {hypotheses.get(ref)?.title} ↗</Link>)}</div>;
  return <div className="story-detail">
    <p className="eyebrow"><Link href="/studio">Студия</Link> {"//"} <Link href="/stories">Истории</Link> {"//"} <b>{story.id}</b></p>
    <div className="story-detail-header"><div><p className="section-kicker">ИСТОРИЯ / В РАЗРАБОТКЕ</p><h1 className="page-title">{story.title}</h1><p className="lead">{story.summary}</p></div><Link href={conceptHref} className="story-source">ПОЛНЫЙ РАБОЧИЙ НАБРОСОК ↗</Link></div>
    <div className="workshop-notice"><strong>РАБОЧИЙ ВАРИАНТ / НЕ КАНОН</strong><span>Связи указывают на материалы для обсуждения. Порядок карточек — редакторский, а не хронология мира; решения и исход не утверждены.</span></div>
    <StoryReview review={review} storyId={story.id} />
    <div className="story-detail-layout"><div className="story-main">
      <section aria-labelledby="scenes-title"><div className="section-head"><h2 id="scenes-title">Сцены и пробы</h2><span className="eyebrow">{story.scenes.length} / МАТЕРИАЛОВ</span></div>
      {story.scenes.map((scene, index) => <article className="story-scene" key={scene.id} id={scene.id}><div className="story-scene-top"><span>МАТЕРИАЛ / {String(index + 1).padStart(2, "0")} · {scene.id}</span><span>{scene.status === "sample" ? "ПРОБА" : "ПЛАН"}</span></div><h3>{scene.title}</h3><p>{scene.purpose}</p><div className="story-time"><b>ВРЕМЯ И МЕСТО</b><span>{scene.chronology}</span>{scene.eventIds.length ? refs(scene.eventIds, []) : <span>События хронологии не привязаны.</span>}</div>
        <h4>Что знают участники в этой пробе</h4><p className="story-note">Роли и знания относятся только к текущей версии сцены, а не к установленным персонажам.</p><div className="story-knowledge">{scene.knowledge.map((entry) => <div key={entry.role}><b>{entry.role}</b>{entry.entityId && <p><Link href={`/entity/${entry.entityId}`}>{entities.get(entry.entityId)?.fm.title} ↗</Link></p>}<p><strong>Известно:</strong> {entry.known}</p><p><strong>Неизвестно:</strong> {entry.unknown}</p></div>)}</div>
        <h4>Вопросы к сцене</h4><ul>{scene.openQuestions.map((question) => <li key={question}>{question}</li>)}</ul>
        {(scene.entityIds.length > 0 || scene.hypothesisIds.length > 0) && <><h4>Материалы сцены</h4>{refs(scene.entityIds, scene.hypothesisIds)}</>}
        <Link href={`${conceptHref}#${encodeURIComponent(headingId(scene.sourceHeading))}`} className="story-read">ЧИТАТЬ ПРОБУ В ИСТОЧНИКЕ ↗</Link>
        {scene.adaptations?.map((adaptation) => <Link key={adaptation.label} href={`${conceptHref}#${encodeURIComponent(headingId(adaptation.sourceHeading))}`} className="story-read">{adaptation.label} ↗</Link>)}
      </article>)}
      {story.scenes.length === 0 && <p>Сцены пока не описаны.</p>}</section>
    </div><aside className="story-side" aria-label="Контекст истории"><section><h2>Связи с миром</h2><p>Это указатели, а не подтверждение описанных событий.</p>{refs(story.entityIds, story.hypothesisIds)}</section><section><h2>Открытые вопросы</h2><ul>{story.openQuestions.map((question) => <li key={question}>{question}</li>)}</ul></section>{diaries.length > 0 && <section><h2>Дневники / рядом с историей</h2><p>Тематические связи, не утверждённая последовательность и не вставка в произведение.</p><div className="story-refs">{diaries.map((entry) => <Link key={entry.id} href={`/diaries#${entry.id}`}>{entry.title} ↗</Link>)}</div></section>}<section><h2>Границы инструмента</h2><p>Пока это обзор данных, не редактор, не приватное хранилище и не автоматическая проверка непрерывности.</p></section></aside></div>
  </div>;
}
