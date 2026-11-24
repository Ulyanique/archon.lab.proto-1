import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHypotheses, resolveHypothesisEntities, getDraftConcepts, conceptsMentioningHypothesis } from "@/lib/workshop";
import { getStories, storiesForHypothesis } from "@/lib/stories";
import { getKb } from "@/lib/lore";
import { renderDocument } from "@/lib/markdown";
import { DecisionEditor } from "@/components/DecisionDraft";

export const dynamicParams = false;
export function generateStaticParams() { return getHypotheses().map(({ id }) => ({ id })); }
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = getHypotheses().find((h) => h.id === id);
  return { title: item ? `${item.id} — ${item.title}` : "Гипотеза" };
}
export default async function HypothesisPage({ params }: Props) {
  const { id } = await params;
  const hypotheses = getHypotheses();
  const item = hypotheses.find((h) => h.id === id);
  if (!item) notFound();
  const concepts = conceptsMentioningHypothesis(id, getDraftConcepts());
  const stories = storiesForHypothesis(id, getStories());
  const known = new Set(hypotheses.map((h) => h.id));
  const kb = getKb();
  const { entities, unavailable } = resolveHypothesisEntities(item, kb);
  return <div className="workshop-detail">
    <p className="eyebrow"><Link href="/hypotheses">Гипотезы</Link> {"//"} <b>{item.id}</b></p>
    <h1 className="page-title">{item.title}</h1>
    <div className="workshop-notice"><strong>{item.status}</strong><span>Гипотеза для обсуждения, не утверждённый канон.</span></div>
    <div className="entity-layout"><div><article className="prose" dangerouslySetInnerHTML={{ __html: renderDocument(kb, item.doc) }} /><DecisionEditor item={{ id: item.id, title: item.title, status: item.status, dependencies: item.dependencies, conflicts: item.conflicts }} nodes={hypotheses.map(({ id, title, status, dependencies, conflicts }) => ({ id, title, status, dependencies, conflicts }))} /></div>
      <aside className="workshop-aside">
        <section><span className="section-kicker">ЗАПИСИ АРХИВА</span>{entities.length ? <ul>{entities.map((entity) => <li key={entity.id}><Link href={`/entity/${entity.id}`}>{entity.fm.title} ↗</Link></li>)}</ul> : <p>Публичные записи не указаны.</p>}{unavailable > 0 ? <p>Некоторые указанные записи недоступны или не найдены; требуется проверка реестра.</p> : null}<p>Ссылка помогает изучить основу идеи, но не превращает её в факт.</p></section>
        <section><span className="section-kicker">УПОМИНАНИЯ ГИПОТЕЗ</span>{item.references.length ? <ul>{item.references.map((ref) => <li key={ref}>{known.has(ref) ? <Link href={`/hypotheses/${ref}`}>{ref} ↗</Link> : <span>{ref} — не найдена</span>}</li>)}</ul> : <p>Ссылок на другие гипотезы нет.</p>}<p>Упоминание может быть отрицанием; проверяйте формулировку в тексте. Связи не означают автоматического принятия.</p></section>
        {stories.length > 0 && <section><span className="section-kicker">ИСТОРИИ / НЕ КАНОН</span><ul>{stories.map((story) => <li key={story.id}><Link href={`/stories/${story.id}`}>{story.title} ↗</Link></li>)}</ul><p>Рабочие сюжеты не утверждают гипотезу или события.</p></section>}
        {concepts.length > 0 && <section><span className="section-kicker">УПОМИНАЕТСЯ В КОНЦЕПЦИЯХ</span><ul>{concepts.map((concept) => <li key={concept.slug}><Link href={`/concept-drafts/${concept.slug}`}>{concept.title} ↗</Link></li>)}</ul><p>Публичные рабочие наброски, не канон. Упоминание не означает принятия идеи.</p></section>}
      </aside>
    </div>
  </div>;
}
