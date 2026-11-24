import type { Metadata } from "next";
import Link from "next/link";
import { getStories } from "@/lib/stories";
import { getHypotheses } from "@/lib/workshop";
import { russianCount } from "@/lib/russian-count";
import { reviewStory } from "@/lib/story-continuity";

export const metadata: Metadata = { title: "Проверка связей историй" };
export default function ContinuityPage() {
  const stories = getStories();
  const hypotheses = getHypotheses();
  const reviews = stories.map((story) => ({ story, review: reviewStory(story, hypotheses) }));
  return <div className="continuity-page"><p className="eyebrow"><Link href="/studio">Студия</Link> {"//"} <b>проверка связей</b></p><header><p className="section-kicker">СЮЖЕТЫ / ОБЗОР УКАЗАТЕЛЕЙ</p><h1 className="page-title">Проверка связей</h1><p className="lead">Рабочий список мест, требующих внимания при разработке историй.</p></header>
    <div className="workshop-notice"><strong>НЕ ПРОВЕРКА ВСЕГО МИРА</strong><span>Сравниваем только указанные в истории и её сценах гипотезы с их прямыми зависимостями и явными несовместимостями. Упоминание не равно принятию; смысл, даты, текст и канон автоматически не проверяются.</span></div>
    <section aria-labelledby="review-stories-title" className="continuity-list"><div className="section-head"><h2 id="review-stories-title">Истории</h2><span className="eyebrow">{reviews.length} / ПРОЕКТОВ</span></div>{reviews.map(({ story, review }) => <article className="continuity-card" key={story.id}><div><span className="studio-tag">{story.id} / РАБОЧАЯ ВЕРСИЯ</span><h3>{story.title}</h3><p>{review.references.length} указателей на гипотезы · {russianCount(review.signals.length, ["сигнал", "сигнала", "сигналов"])} по двум правилам</p></div><Link href={`/stories/${story.id}#story-review`}>ПОСМОТРЕТЬ ПРОВЕРКУ ↗</Link></article>)}{reviews.length === 0 && <p>Историй пока нет.</p>}</section>
    <p className="studio-privacy">Отсутствие сигналов не доказывает согласованности мира. Для каждого решения проверяйте источник, условия и неизвестные сведения вручную.</p>
  </div>;
}
