import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SECTIONS, TYPE_INFO, type SectionKey } from "@archon/lore-schema";
import { EntityCard } from "@/components/ui";
import { entitiesInSection } from "@/lib/lore";

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
    </>
  );
}
