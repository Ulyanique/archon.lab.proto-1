"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Core, ElementDefinition } from "cytoscape";
import { buildHypothesisGraph, type HypothesisGraphNode } from "@/lib/hypothesis-graph";

type Kind = "mention" | "dependency" | "conflict";
const kinds: { id: Kind; label: string }[] = [
  { id: "mention", label: "УПОМИНАНИЕ" },
  { id: "dependency", label: "ОБЯЗАТЕЛЬНАЯ ЗАВИСИМОСТЬ →" },
  { id: "conflict", label: "НЕСОВМЕСТИМЫЕ ВАРИАНТЫ" },
];

/** Карта рабочих предложений; список остаётся доступным с клавиатуры независимо от графа. */
export function HypothesisGraph({ nodes }: { nodes: HypothesisGraphNode[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [enabled, setEnabled] = useState<Kind[]>(["mention", "dependency", "conflict"]);
  const [graphError, setGraphError] = useState(false);
  const [ready, setReady] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const graph = useRef<Core | null>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const focusDetail = useRef(false);
  const { edges, unresolved } = useMemo(() => buildHypothesisGraph(nodes), [nodes]);
  const selected = nodes.find((node) => node.id === selectedId);
  const normalizedQuery = query.trim().toLocaleLowerCase("ru").replace(/ё/g, "е");
  const visible = useMemo(() => nodes.filter((node) => `${node.id} ${node.title}`.toLocaleLowerCase("ru").replace(/ё/g, "е").includes(normalizedQuery)), [nodes, normalizedQuery]);
  const select = (id: string) => {
    if (selectedId && selectedId !== id) setHistory((current) => [...current, selectedId].slice(-30));
    setSelectedId(id);
  };
  const selectRef = useRef(select);
  useEffect(() => { selectRef.current = select; });
  const related = selected ? edges.filter((edge) => edge.source === selected.id || edge.target === selected.id) : [];
  const grouped = new Map<string, string[]>();
  for (const edge of related) {
    const other = edge.source === selectedId ? edge.target : edge.source;
    const relation = edge.kind === "conflict" ? "несовместимые варианты при указанных условиях" : edge.kind === "dependency" ? edge.source === selectedId ? "требует эту гипотезу" : "зависит от выбранной" : edge.source === selectedId ? "упомянута в выбранной" : "упоминает выбранную";
    grouped.set(other, [...(grouped.get(other) ?? []), relation]);
  }

  useEffect(() => {
    let cancelled = false;
    let cy: Core | undefined;
    import("cytoscape").then(({ default: cytoscape }) => {
      if (cancelled || !container.current) return;
      const elements: ElementDefinition[] = [
        ...nodes.map((node, i) => ({ data: { id: node.id, label: node.id }, position: { x: 400 + 260 * Math.cos(2 * Math.PI * i / Math.max(nodes.length, 1)), y: 300 + 220 * Math.sin(2 * Math.PI * i / Math.max(nodes.length, 1)) } })),
        ...edges.map((edge, i) => ({ data: { id: `hyp-edge-${i}`, source: edge.source, target: edge.target, kind: edge.kind } })),
      ];
      cy = cytoscape({ container: container.current, elements,
        layout: { name: "cose", animate: false, randomize: false, fit: true, padding: 70, nodeRepulsion: () => 500000, nodeOverlap: 40, nodeDimensionsIncludeLabels: true, idealEdgeLength: () => 160, numIter: 1000 },
        minZoom: 0.08, maxZoom: 3,
        style: [
          { selector: "node", style: { width: 32, height: 32, "background-color": "#94b39a", "border-color": "#c0d6be", "border-width": 1, label: "data(label)", color: "#d9e2db", "font-family": "Manrope, sans-serif", "font-size": 22, "font-weight": 700, "text-valign": "bottom", "text-margin-y": 12, "text-background-color": "#111817", "text-background-opacity": .85, "text-background-padding": "3px" } },
          { selector: "edge", style: { width: 1.2, "line-color": "#879d90", opacity: .6, "curve-style": "bezier" } },
          { selector: 'edge[kind = "mention"]', style: { "line-style": "dashed" } },
          { selector: 'edge[kind = "dependency"]', style: { width: 2.5, "line-color": "#e4a96a", "target-arrow-color": "#e4a96a", "target-arrow-shape": "triangle", "arrow-scale": 1 } },
          { selector: 'edge[kind = "conflict"]', style: { width: 2.5, "line-color": "#e77f80", "line-style": "dashed" } },
          { selector: ".dimmed", style: { opacity: .1, "text-opacity": .25 } },
          { selector: "edge.highlighted", style: { opacity: 1, width: 3 } },
          { selector: "node.match", style: { "background-color": "#c47e43", "border-color": "#f2d1a4", "border-width": 3 } },
          { selector: "node.focused", style: { width: 46, height: 46, "background-color": "#c47e43", "border-color": "#f2d1a4", "border-width": 4 } },
          { selector: ".hidden-kind", style: { display: "none" } },
        ],
      });
      graph.current = cy;
      cy.on("tap", "node", (event) => selectRef.current(event.target.id()));
      cy.on("tap", (event) => { if (event.target === cy) { setSelectedId(null); setHistory([]); } });
      // Синхронизировать выбор/фильтры, если пользователь изменил их, пока загружался модуль.
      setReady((value) => value + 1);
    }).catch(() => { if (!cancelled) setGraphError(true); });
    return () => { cancelled = true; cy?.destroy(); graph.current = null; };
  }, [nodes, edges]);
  useEffect(() => {
    const cy = graph.current;
    if (!cy) return;
    cy.edges().forEach((edge) => {
      const shown = enabled.includes(edge.data("kind") as Kind);
      const connected = edge.source().id() === selectedId || edge.target().id() === selectedId;
      edge.toggleClass("hidden-kind", !shown);
      edge.toggleClass("dimmed", selectedId ? !connected : !!normalizedQuery);
      edge.toggleClass("highlighted", !!selectedId && connected);
    });
    const neighbors = new Set<string>();
    cy.edges().forEach((edge) => { if (enabled.includes(edge.data("kind") as Kind) && (edge.source().id() === selectedId || edge.target().id() === selectedId)) { neighbors.add(edge.source().id()); neighbors.add(edge.target().id()); } });
    const matches = new Set(visible.map((node) => node.id));
    cy.nodes().forEach((node) => {
      node.toggleClass("focused", node.id() === selectedId);
      node.toggleClass("match", !selectedId && !!normalizedQuery && matches.has(node.id()));
      node.toggleClass("dimmed", selectedId ? node.id() !== selectedId && !neighbors.has(node.id()) : !!normalizedQuery && !matches.has(node.id()));
    });
  }, [selectedId, enabled, ready, normalizedQuery, visible]);
  useEffect(() => {
    if (focusDetail.current && selectedId) { detailHeading.current?.focus(); focusDetail.current = false; }
  }, [selectedId]);
  const focus = () => { const cy = graph.current; const node = selectedId && cy?.getElementById(selectedId); if (cy && node && node.nonempty()) { cy.zoom(Math.min(Math.max(cy.zoom() * 1.5, 0.7), cy.maxZoom())); cy.center(node); } };
  const zoom = (factor: number) => { const cy = graph.current; if (cy) cy.zoom({ level: Math.max(cy.minZoom(), Math.min(cy.maxZoom(), cy.zoom() * factor)), renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }); };

  return <section className="hyp-graph" id="hypothesis-graph" aria-labelledby="hyp-graph-title">
    <div className="hyp-graph-heading"><div><p className="section-kicker">МАСТЕРСКАЯ / КАРТА РЕШЕНИЙ</p><h2 id="hyp-graph-title">Связи гипотез</h2><p>Отдельно от графа опубликованного лора. Выберите ID на карте или в списке, чтобы изучить контекст.</p></div><span>{nodes.length} ИДЕЙ / {edges.length} СВЯЗЕЙ</span></div>
    <div className="hyp-graph-layout"><div className="hyp-map">
      <div className="hyp-map-toolbar"><div className="hyp-map-legend" aria-label="Типы связей на карте">{kinds.map((kind) => <label key={kind.id}><input type="checkbox" checked={enabled.includes(kind.id)} onChange={() => setEnabled((current) => current.includes(kind.id) ? current.filter((item) => item !== kind.id) : [...current, kind.id])} /><i className={kind.id} /> {kind.label}</label>)}</div></div>
      <div className="hyp-map-stage"><div ref={container} className="hyp-map-canvas" aria-hidden="true" />{graphError && <p className="hyp-map-error" role="status">Не удалось загрузить карту. Используйте список гипотез справа или ниже.</p>}<div className="hyp-map-controls" aria-label="Масштаб карты"><button type="button" onClick={() => zoom(1.3)} aria-label="Приблизить карту">+</button><button type="button" onClick={() => zoom(1 / 1.3)} aria-label="Отдалить карту">−</button><button type="button" onClick={() => graph.current?.fit(undefined, 55)} aria-label="Показать всю карту">Вся карта</button></div></div>
      <p className="hyp-map-note">Перетаскивайте узлы и поле; масштабируйте колесом, жестом или кнопками. Для выбора с клавиатуры используйте список гипотез. Поиск подсвечивает совпадения, когда выбор сброшен. Флажки меняют только отображение линий, не сами связи.</p>
    </div><div className="hyp-graph-sidebar">
      <label htmlFor="hyp-graph-search">ПОИСК ПО ID ИЛИ НАЗВАНИЮ</label><input id="hyp-graph-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например, H-006" />
      {selected ? <div className="hyp-graph-detail"><span className="section-kicker">{selected.id} / {selected.status}</span><h3 ref={detailHeading} tabIndex={-1}>{selected.title}</h3><Link href={`/hypotheses/${selected.id}`}>ОТКРЫТЬ ГИПОТЕЗУ ↗</Link><button type="button" onClick={focus}>ПОКАЗАТЬ НА КАРТЕ ⌖</button><button type="button" onClick={() => { setSelectedId(null); setHistory([]); }}>СБРОСИТЬ ВЫБОР</button>{history.length > 0 && <button type="button" onClick={() => { focusDetail.current = true; setSelectedId(history[history.length - 1]); setHistory(history.slice(0, -1)); }}>← НАЗАД: {history[history.length - 1]}</button>}<h4>УПОМИНАНИЯ, ЗАВИСИМОСТИ И НЕСОВМЕСТИМОСТИ</h4>{grouped.size ? <ul>{[...grouped].map(([other, relations]) => <li key={other}><div className="hyp-relation-target"><span className="hyp-relation-name">{nodes.find((node) => node.id === other)?.title}</span><Link href={`/hypotheses/${other}`}>{other} ↗</Link><button type="button" onClick={() => { focusDetail.current = true; select(other); setQuery(""); }} aria-label={`Выбрать ${other} на карте`}>на карте</button></div><span>{relations.map((relation) => <span key={relation}>{relation}</span>)}</span></li>)}</ul> : <p>Нет известных связей.</p>}</div> : <p className="hyp-graph-help">Выберите узел на карте или в списке, чтобы увидеть его связи.</p>}
      <div className="hyp-list-title">ВСЕ ГИПОТЕЗЫ <span>{visible.length} / {nodes.length}</span></div><ul className="hyp-list" aria-label="Гипотезы на карте">{visible.map((node) => <li key={node.id}><button type="button" aria-pressed={node.id === selectedId} onClick={() => select(node.id)}><b>{node.id}</b><span>{node.title}</span></button></li>)}</ul>{visible.length === 0 && <p className="hyp-graph-help">Ничего не найдено.</p>}
    </div></div>
    {unresolved.length > 0 && <p className="hyp-unresolved">Не найдены упомянутые ID: {unresolved.map((item) => `${item.source} → ${item.target}`).join(", ")}. Проверьте реестр.</p>}
    <p className="hyp-graph-disclaimer">Пунктир — только упоминание ID, в том числе в отрицании. Связь и принятие одной идеи не означают принятия другой. Стрелка направлена от зависимой гипотезы к требуемой; несовместимость не имеет направления и может действовать только при определённых условиях. Проверяйте формулировки в записях.</p>
  </section>;
}
