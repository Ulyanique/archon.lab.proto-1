import type { Metadata } from "next";
import Link from "next/link";
import { getKb, metaNotes } from "@/lib/lore";
import { documentTitle, renderDocument } from "@/lib/markdown";

export const metadata: Metadata = { title: "Вселенная" };

const PRINCIPLES = "Принципы и темы вселенной";

export default function UniversePage() {
  const kb = getKb();
  const notes = metaNotes(kb);
  const principles = notes.find((n) => n.doc.fileName === PRINCIPLES);
  const others = notes.filter((n) => n !== principles);

  return (
    <>
      <p className="eyebrow">
        <b>Вселенная</b> {"//"} общее описание
      </p>
      <h1 className="page-title">Вселенная Архон</h1>
      <p className="lead">
        Общие принципы, стиль, правила канона и открытые вопросы. Это не сущности лора, а рамки, в которых он развивается.
      </p>
      <hr className="rule" />
      {principles ? <article className="prose" dangerouslySetInnerHTML={{ __html: renderDocument(kb, principles.doc) }} /> : null}

      <div className="section-head">
        <h2>Справочные материалы</h2>
      </div>
      <div className="grid">
        {others.map((n) => (
          <Link key={n.slug} href={`/universe/${n.slug}`} className="card">
            <div className="meta">
              <span>Материал</span>
              <span>{n.doc.path.replace("universe/00-meta/", "")}</span>
            </div>
            <h3>{documentTitle(n.doc)}</h3>
          </Link>
        ))}
      </div>
    </>
  );
}
