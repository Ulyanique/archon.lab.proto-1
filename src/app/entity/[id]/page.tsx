import type { Metadata } from "next";
import Link from "next/link";
import { ArtPreview } from "@/components/ArtPreview";
import { artForEntity } from "@/lib/concept-art";
import { modelsForEntity } from "@/lib/model-media";
import { notFound } from "next/navigation";
import {
  DATE_CERTAINTY_LABELS,
  DATE_PRECISION_LABELS,
  SCIENCE_STATUS_LABELS,
  TYPE_INFO,
  SECTIONS,
  isPublishedStatus,
} from "@archon/lore-schema";
import { CanonNotice, StatusStamp } from "@/components/ui";
import { getKb, linksFor, publishedEntities, type LinkedEntity } from "@/lib/lore";
import { renderDocument } from "@/lib/markdown";
import { diariesForEntity, getDiaries } from "@/lib/diaries";
import { getStories, storiesForEntity } from "@/lib/stories";
import { getHypotheses, hypothesesForEntity } from "@/lib/workshop";

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedEntities().map((e) => ({ id: e.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const entity = getKb().byId.get(id);
  return entity && isPublishedStatus(entity.fm.status) ? { title: entity.fm.title, description: entity.fm.summary } : {};
}

function LinkList({ items, direction }: { items: LinkedEntity[]; direction: "out" | "in" }) {
  return (
    <ul>
      {items.map(({ edge, entity }) => (
        <li key={`${edge.source}-${edge.target}-${edge.type}`}>
          <span className="rel">
            {direction === "in" ? "← " : ""}
            {edge.label}
          </span>
          <Link href={`/entity/${entity.id}`}>{entity.fm.title}</Link>
          {edge.note ? <span className="rel" style={{ textTransform: "none", letterSpacing: 0 }}>{edge.note}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export default async function EntityPage({ params }: Props) {
  const { id } = await params;
  const kb = getKb();
  const entity = kb.byId.get(id);
  if (!entity || !isPublishedStatus(entity.fm.status)) notFound();
  const { fm, doc } = entity;
  const html = renderDocument(kb, doc);
  const { outgoing, incoming } = linksFor(id, kb);
  const isEvent = (l: LinkedEntity) => l.entity.fm.type === "event";
  const events = [...outgoing, ...incoming].filter(isEvent);
  const eventIds = new Set<string>();
  const uniqueEvents = events.filter((l) => (eventIds.has(l.entity.id) ? false : (eventIds.add(l.entity.id), true)));
  const out = fm.type === "event" ? outgoing : outgoing.filter((l) => !isEvent(l));
  const inc = fm.type === "event" ? incoming : incoming.filter((l) => !isEvent(l));
  const section = TYPE_INFO[fm.type].section;
  const media = artForEntity(id);
  const models = modelsForEntity(id);
  const hypotheses = hypothesesForEntity(id, getHypotheses());
  const stories = storiesForEntity(id, getStories());
  const diaries = diariesForEntity(id, getDiaries());
  const characterProfile = fm.type === "character" && media.length > 0;
  const mediaSection = media.length > 0 && <section className="entity-media" aria-labelledby="entity-media-title">
        <div className="entity-media-heading"><div><p className="section-kicker">ВИЗУАЛЬНАЯ МАСТЕРСКАЯ / НЕ КАНОН</p><h2 id="entity-media-title">Визуальные исследования</h2><p>Образы для обсуждения, не утверждённый облик или факт о мире.</p></div><Link href="/concept-art">ВСЕ РАБОТЫ ↗</Link></div>
        <div className="entity-media-grid">{media.map((item, index) => <figure key={item.id}><ArtPreview item={item} eager={index === 0} /><figcaption><span>{item.id.toUpperCase()} / {item.category}</span><h3>{item.title}</h3><p>{item.description}</p><Link href={`/concept-art#${item.id}`}>ПРОИСХОЖДЕНИЕ И ПРОМПТ ↗</Link></figcaption></figure>)}</div>
      </section>;

  return (
    <>
      <p className="eyebrow">
        <Link href={`/${section}`}>{SECTIONS[section].title}</Link> {"//"} {TYPE_INFO[fm.type].label} {"//"} запись <b>{fm.id}</b>
      </p>
      <div className={characterProfile ? "entity-profile" : undefined}>
        <div className="entity-profile-copy">
          <h1 className="page-title">{fm.title}</h1>
          <p style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "0 0 4px" }}>
            <StatusStamp status={fm.status} />
            {fm.aliases.length ? <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>также: {fm.aliases.join(" · ")}</span> : null}
          </p>
          {fm.summary ? <p className="lead">{fm.summary}</p> : null}
          <CanonNotice status={fm.status} />
          {characterProfile && <nav className="entity-profile-nav" aria-label="На странице"><a href="#entity-story">История ↓</a><a href="#entity-connections">Связи и метаданные ↓</a></nav>}
        </div>
        {characterProfile && mediaSection}
      </div>
      <hr className="rule" />
      {!characterProfile && mediaSection}
      {models.length > 0 && <section className="entity-models" aria-labelledby="entity-models-title"><p className="section-kicker">3D / РАБОЧИЕ МАТЕРИАЛЫ</p><h2 id="entity-models-title">Трёхмерные модели</h2><p>Модели предназначены для изучения и не утверждают канон. Для просмотра GLB нужен совместимый просмотрщик.</p><ul>{models.map((model) => <li key={model.id}><div><h3>{model.title}</h3><p>{model.description}</p><small>{model.author} · {model.rights}</small></div><a href={model.file} download>СКАЧАТЬ GLB ↗</a></li>)}</ul></section>}
      <div className="entity-layout">
        <article id="entity-story" className="prose" dangerouslySetInnerHTML={{ __html: html }} />

        <aside id="entity-connections" className="aside" aria-label="Метаданные и связи">
          <section>
            <h3>МЕТАДАННЫЕ</h3>
            <dl>
              <dt>ID</dt>
              <dd>{fm.id}</dd>
              <dt>Тип</dt>
              <dd>{TYPE_INFO[fm.type].label}</dd>
              <dt>Статус</dt>
              <dd>{fm.status}</dd>
              <dt>Создано</dt>
              <dd>{fm.created}</dd>
              <dt>Обновлено</dt>
              <dd>{fm.updated}</dd>
              {fm.science_status ? (
                <>
                  <dt>Наука</dt>
                  <dd>{SCIENCE_STATUS_LABELS[fm.science_status]}</dd>
                </>
              ) : null}
              <dt>Файл</dt>
              <dd>{doc.path}</dd>
            </dl>
            {fm.tags.length ? (
              <div className="tags" style={{ padding: "0 14px 12px", marginTop: 0 }}>
                {fm.tags.map((t) => (
                  <span key={t} className="tag">#{t}</span>
                ))}
              </div>
            ) : null}
          </section>

          {hypotheses.length > 0 ? (
            <section className="entity-workshop">
              <h3>МАСТЕРСКАЯ / НЕ КАНОН</h3>
              <p>Идеи для обсуждения, связанные с этой записью. Их содержание и решения не являются частью лора.</p>
              <ul>{hypotheses.map((item) => <li key={item.id}><Link href={`/hypotheses/${item.id}`}><b>{item.id}</b> · {item.title}</Link><span>{item.status}</span></li>)}</ul>
              <Link className="entity-workshop-all" href="/hypotheses">ВСЕ ГИПОТЕЗЫ ↗</Link>
            </section>
          ) : null}

          {stories.length > 0 && <section className="entity-workshop"><h3>ИСТОРИИ / НЕ КАНОН</h3><p>Рабочие сюжеты, связанные с записью; события не устанавливаются как факт.</p><ul>{stories.map((story) => <li key={story.id}><Link href={`/stories/${story.id}`}>{story.title} ↗</Link></li>)}</ul></section>}

          {diaries.length > 0 && <section className="entity-workshop"><h3>ДНЕВНИКИ / НЕ КАНОН</h3><p>Художественный голос Харпера; наблюдения и события не утверждены.</p><ul>{diaries.map((entry) => <li key={entry.id}><Link href={`/diaries#${entry.id}`}>{entry.title} ↗</Link></li>)}</ul><Link className="entity-workshop-all" href="/diaries">ВСЕ ДНЕВНИКИ ↗</Link></section>}

          {fm.date ? (
            <section>
              <h3>ДАТА СОБЫТИЯ</h3>
              <dl>
                <dt>Точность</dt>
                <dd>{DATE_PRECISION_LABELS[fm.date.precision]}</dd>
                <dt>Достоверность</dt>
                <dd>{DATE_CERTAINTY_LABELS[fm.date.certainty]}</dd>
                {fm.date.start ? (
                  <>
                    <dt>Начало</dt>
                    <dd>{fm.date.start}</dd>
                  </>
                ) : null}
                {fm.date.end ? (
                  <>
                    <dt>Конец</dt>
                    <dd>{fm.date.end}</dd>
                  </>
                ) : null}
                <dt>Календарь</dt>
                <dd>{fm.date.calendar}</dd>
                {fm.date.note ? (
                  <>
                    <dt>Примечание</dt>
                    <dd>{fm.date.note}</dd>
                  </>
                ) : null}
              </dl>
            </section>
          ) : null}

          {out.length ? (
            <section>
              <h3>СВЯЗАННЫЕ ЗАПИСИ</h3>
              <LinkList items={out} direction="out" />
            </section>
          ) : null}
          {inc.length ? (
            <section>
              <h3>ССЫЛАЮТСЯ НА ЭТУ ЗАПИСЬ</h3>
              <LinkList items={inc} direction="in" />
            </section>
          ) : null}
          {uniqueEvents.length && fm.type !== "event" ? (
            <section>
              <h3>СОБЫТИЯ</h3>
              <ul>
                {uniqueEvents.map(({ entity: ev }) => (
                  <li key={ev.id}>
                    <Link href={`/entity/${ev.id}`}>{ev.fm.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
