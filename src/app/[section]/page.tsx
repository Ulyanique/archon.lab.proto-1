import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SECTIONS, TYPE_INFO, type SectionKey } from "@archon/lore-schema";
import { EntityCard } from "@/components/ui";
import { entitiesInSection } from "@/lib/lore";
import { getDraftConcepts } from "@/lib/workshop";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(SECTIONS).map((section) => ({ section }));
}

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: SECTIONS[section as SectionKey]?.title ?? "Раздел" };
}

export default async function SectionPage({ params }: Props) {
  const { section } = await params;
  if (!(section in SECTIONS)) notFound();
  const def = SECTIONS[section as SectionKey];
  const entities = entitiesInSection(section as SectionKey);
  const types = def.types.filter((t) => entities.some((e) => e.fm.type === t));
  const drafts = section === "concepts" ? getDraftConcepts() : [];

  return (
    <>
      <p className="eyebrow">
        <b>Каталог</b> {"//"} {entities.length} зап.
      </p>
      <h1 className="page-title">{def.title}</h1>
      <p className="lead">{def.description}</p>
      <hr className="rule" />
      {entities.length === 0 ? (
        <div className="empty">
          <p style={{ margin: 0 }}>
            В этом разделе пока нет записей. Содержимое не придумывается: записи появятся, когда в <code>universe/</code> будут добавлены сущности соответствующих типов ({def.types.map((t) => TYPE_INFO[t].label.toLowerCase()).join(", ")}).
          </p>
        </div>
      ) : (
        types.map((type) => (
          <section key={type}>
            {types.length > 1 ? (
              <div className="section-head">
                <h2>{TYPE_INFO[type].labelPlural}</h2>
              </div>
            ) : null}
            <div className="grid">
              {entities
                .filter((e) => e.fm.type === type)
                .map((e) => (
                  <EntityCard key={e.id} item={{ id: e.id, title: e.fm.title, type: e.fm.type, status: e.fm.status, summary: e.fm.summary }} />
                ))}
            </div>
          </section>
        ))
      )}
      {drafts.length > 0 ? <section className="concept-drafts"><div className="section-head"><h2>Концепции в разработке</h2><span className="eyebrow">ЧЕРНОВИКИ / НЕ КАНОН</span></div><p className="concept-drafts-lead">Проекты для обсуждения, которые ещё не утверждены как лор.</p><div className="grid">{drafts.map((draft) => <Link className="card" href={`/concept-drafts/${draft.slug}`} key={draft.slug}><div className="meta"><span>Рабочая концепция</span><span>Черновик</span></div><h3>{draft.title}</h3><p>Открыть концепцию и вопросы для обсуждения ↗</p></Link>)}</div></section> : null}
    </>
  );
}
