import type { Metadata } from "next";
import { ArtPreview } from "@/components/ArtPreview";
import { getConceptArt } from "@/lib/concept-art";
import { CopyPrompt } from "@/components/CopyPrompt";

export const metadata: Metadata = { title: "Концепт-арт" };

export default function ConceptArtPage() {
  const items = getConceptArt();
  return <div className="workshop-page">
    <p className="eyebrow"><b>Визуальный архив</b> {"//"} исследования и образы</p>
    <div className="workshop-heading"><div><h1 className="page-title">Концепт-арт</h1><p className="lead">Визуальные исследования вселенной и промпты, с которыми они были созданы.</p></div><div className="workshop-count"><b>{String(items.length).padStart(2, "0")}</b><span>РАБОТ В АРХИВЕ</span></div></div>
    <div className="workshop-notice"><strong>ВИЗУАЛЬНЫЕ ГИПОТЕЗЫ</strong><span>Образы не устанавливают факты канона. Авторство и условия использования указаны для каждой работы.</span></div>
    <div className="art-list">{items.map((item, index) => <article className="art-card" id={item.id} key={item.id}>
      <div className="art-image"><ArtPreview item={item} eager={index === 0} /><span>{item.id.toUpperCase()} / {item.category}</span></div>
      <div className="art-info"><div className="hypothesis-meta"><span>{item.id.toUpperCase()}</span><span>{item.category}</span></div><h2>{item.title}</h2><p>{item.description}</p><p className="art-attribution">{item.author} · {item.rights}</p><details className="prompt-details"><summary>ПРОМПТ ИЗОБРАЖЕНИЯ <span>+</span></summary><p>{item.prompt}</p><CopyPrompt prompt={item.prompt} /></details><a className="text-link art-original" href={item.image} target="_blank" rel="noreferrer">ОТКРЫТЬ ОРИГИНАЛ ↗</a></div>
    </article>)}</div>
  </div>;
}
