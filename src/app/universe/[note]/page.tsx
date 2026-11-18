import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKb, metaNotes } from "@/lib/lore";
import { documentTitle, renderDocument } from "@/lib/markdown";

export const dynamicParams = false;

export function generateStaticParams() {
  return metaNotes().map((n) => ({ note: n.slug }));
}

type Props = { params: Promise<{ note: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { note } = await params;
  const found = metaNotes().find((n) => n.slug === note);
  return found ? { title: documentTitle(found.doc) } : {};
}

export default async function MetaNotePage({ params }: Props) {
  const { note } = await params;
  const kb = getKb();
  const found = metaNotes(kb).find((n) => n.slug === note);
  if (!found) notFound();
  return (
    <>
      <p className="eyebrow">
        <Link href="/universe">Вселенная</Link> {"//"} справочный материал {"//"} <b>{found.doc.path}</b>
      </p>
      <h1 className="page-title">{documentTitle(found.doc)}</h1>
      <hr className="rule" />
      <article className="prose" dangerouslySetInnerHTML={{ __html: renderDocument(kb, found.doc) }} />
    </>
  );
}
