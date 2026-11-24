import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDraftConcepts } from "@/lib/workshop";
import { getKb } from "@/lib/lore";
import { renderDocument } from "@/lib/markdown";

export const dynamicParams = false;
export function generateStaticParams() { return getDraftConcepts().map(({ slug }) => ({ slug })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: getDraftConcepts().find((c) => c.slug === slug)?.title ?? "Концепция" };
}
export default async function DraftConceptPage({ params }: Props) {
  const { slug } = await params;
  const item = getDraftConcepts().find((c) => c.slug === slug);
  if (!item) notFound();
  return <div className="workshop-detail"><p className="eyebrow"><Link href="/concepts">Концепции</Link> {"//"} <b>черновик</b></p><h1 className="page-title">{item.title}</h1><div className="workshop-notice"><strong>РАБОЧАЯ КОНЦЕПЦИЯ</strong><span>Проект для обсуждения, не утверждённый канон.</span></div><article className="prose" dangerouslySetInnerHTML={{ __html: renderDocument(getKb(), item.doc) }} /></div>;
}
