import type { Metadata } from "next";
import { getHypotheses } from "@/lib/workshop";
import { HypothesisGraph } from "@/components/HypothesisGraph";
import { HypothesisList } from "@/components/HypothesisList";
import { DecisionOverview } from "@/components/DecisionDraft";

export const metadata: Metadata = { title: "Гипотезы" };

export default function HypothesesPage() {
  const hypotheses = getHypotheses();
  return (
    <div className="workshop-page">
      <p className="eyebrow"><b>Мастерская</b> {"//"} идеи и взаимосвязи</p>
      <div className="workshop-heading"><div><h1 className="page-title">Гипотезы</h1><p className="lead">Идеи, из которых может вырасти вселенная. Изучайте, обсуждайте и выбирайте направление.</p></div><div className="workshop-count"><b>{String(hypotheses.length).padStart(2, "0")}</b><span>ГИПОТЕЗ В РЕЕСТРЕ</span></div></div>
      <div className="workshop-notice"><strong>ПРЕДЛОЖЕНИЯ, НЕ КАНОН</strong><span>Решение по одной гипотезе не утверждает её зависимости. Обсудить идею можно по её идентификатору.</span></div>
      <nav className="hypothesis-jump" aria-label="Разделы мастерской"><a href="#hypothesis-list"><b>01</b><span>КАТАЛОГ ГИПОТЕЗ</span><span aria-hidden="true">↓</span></a><a href="#decision-drafts"><b>02</b><span>МОИ ЧЕРНОВИКИ</span><span aria-hidden="true">↓</span></a><a href="#hypothesis-graph"><b>03</b><span>КАРТА СВЯЗЕЙ</span><span aria-hidden="true">↓</span></a></nav>
      <DecisionOverview nodes={hypotheses.map(({ id, title, status, dependencies, conflicts }) => ({ id, title, status, dependencies, conflicts }))} />
      <HypothesisGraph nodes={hypotheses.map(({ id, title, status, references, dependencies, conflicts }) => ({ id, title, status, references, dependencies, conflicts }))} />
      <HypothesisList items={hypotheses.map(({ id, title, status, summary, references }) => ({ id, title, status, summary, referencesCount: references.length }))} />
    </div>
  );
}
