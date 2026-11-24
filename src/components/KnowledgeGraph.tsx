"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import { STATUS_INFO, TYPE_INFO, type EntityType, type Status } from "@archon/lore-schema";
import type { GraphEdge, GraphNode } from "@archon/lore-indexer";

interface Props { nodes: GraphNode[]; edges: GraphEdge[] }

/** Карта визуализирует только переданные опубликованные данные; таблица связей остаётся доступной ниже. */
export function KnowledgeGraph({ nodes, edges }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const graph = useRef<Core | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const selected = nodes.find((n) => n.id === selectedId);
  const types = [...new Set(nodes.map((n) => n.type))];
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("ru").replace(/ё/g, "е");
    return nodes.filter((n) => (!type || n.type === type) && (!q || `${n.label} ${n.id}`.toLocaleLowerCase("ru").replace(/ё/g, "е").includes(q)));
  }, [nodes, query, type]);
  const selectedEdges = selected ? edges.filter((e) => e.source === selected.id || e.target === selected.id) : [];
  const focusSelected = () => {
    const cy = graph.current;
    const node = selectedId && cy?.getElementById(selectedId);
    if (!cy || !node || node.empty()) return;
    cy.zoom(Math.min(1.4, cy.maxZoom()));
    cy.center(node);
  };

  useEffect(() => {
    if (!container.current) return;
    const elements: ElementDefinition[] = [
      ...nodes.map((n, i) => ({ data: { id: n.id, label: n.label, type: n.type }, position: { x: 400 + 270 * Math.cos(2 * Math.PI * i / Math.max(nodes.length, 1)), y: 300 + 220 * Math.sin(2 * Math.PI * i / Math.max(nodes.length, 1)) } })),
      ...edges.map((e, i) => ({ data: { id: `edge-${i}`, source: e.source, target: e.target, label: e.label } })),
    ];
    const cy = cytoscape({
      container: container.current,
      elements,
      // Детерминированный круговой начальный обзор избегает схлопывания подписей.
      // Пользователь может свободно перетаскивать узлы после загрузки.
      layout: { name: "preset", fit: true, padding: 70 },
      minZoom: 0.3,
      maxZoom: 2.5,
      style: [
        { selector: "node", style: { "background-color": "#b86c36", "border-color": "#e3b078", "border-width": 1, width: 14, height: 14, label: "data(label)", color: "#d8dfd9", "font-family": "Manrope, sans-serif", "font-size": 10, "text-valign": "bottom", "text-margin-y": 9, "text-max-width": "125px", "text-wrap": "wrap", "text-background-color": "#101617", "text-background-opacity": 0.9, "text-background-padding": "3px" } },
        { selector: 'node[type = "ai"], node[type = "character"]', style: { "background-color": "#c7854c" } },
        { selector: 'node[type = "location"]', style: { "background-color": "#7c9b80", "border-color": "#b0c7ac" } },
        { selector: 'node[type = "event"]', style: { "background-color": "#8a9ba7", "border-color": "#bdcdd5" } },
        { selector: "edge", style: { width: 1, "line-color": "#65746c", opacity: .55, "curve-style": "bezier", "target-arrow-shape": "triangle", "target-arrow-color": "#65746c", "arrow-scale": .7 } },
        { selector: ".dimmed", style: { opacity: .16, "text-opacity": .3 } },
        { selector: ".focused", style: { "border-width": 4, "border-color": "#f0d0a6", width: 20, height: 20 } },
      ],
    });
    graph.current = cy;
    cy.on("tap", "node", (event) => setSelectedId(event.target.id()));
    return () => { cy.destroy(); graph.current = null; };
  }, [nodes, edges]);

  useEffect(() => {
    const cy = graph.current;
    if (!cy) return;
    const visible = new Set(filtered.map((n) => n.id));
    cy.nodes().forEach((node) => { node.toggleClass("dimmed", !visible.has(node.id())); node.toggleClass("focused", node.id() === selectedId); });
    cy.edges().forEach((edge) => { edge.toggleClass("dimmed", !visible.has(edge.source().id()) || !visible.has(edge.target().id())); });
  }, [filtered, selectedId]);

  return <section className="knowledge-graph" aria-labelledby="graph-title">
    <div className="graph-header"><div><p className="section-kicker">КАРТА / ЖИВАЯ БАЗА ЗНАНИЙ</p><h2 id="graph-title">ГРАФ ВСЕЛЕННОЙ</h2><p>Исследуйте связи между опубликованными записями. Перетаскивайте узлы и приближайте карту.</p></div><div className="graph-count"><b>{nodes.length}</b><span>УЗЛОВ / {edges.length} СВЯЗЕЙ</span></div></div>
    <div className="graph-layout">
      <div className="graph-visual"><div className="graph-canvas" ref={container} aria-hidden="true" /><div className="graph-overlay"><span>ARCHON / KNOWLEDGE MAP</span><button type="button" onClick={() => graph.current?.fit(undefined, 55)}>ВПИСАТЬ В ЭКРАН ⌖</button></div><p className="graph-hint">ПЕРЕТАЩИТЬ / КОЛЕСО ИЛИ ЖЕСТ ДЛЯ МАСШТАБА</p></div>
      <div className="graph-sidebar"><div className="graph-controls"><label htmlFor="graph-search">ПОИСК УЗЛА</label><input id="graph-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Имя или ID..." /><label htmlFor="graph-type">ТИП ЗАПИСИ</label><select id="graph-type" value={type} onChange={(e) => setType(e.target.value)}><option value="">Все типы</option>{types.map((t) => <option key={t} value={t}>{TYPE_INFO[t as EntityType]?.label ?? t}</option>)}</select></div>
        {selected ? <div className="graph-selection"><p className="section-kicker">ВЫБРАННАЯ ЗАПИСЬ</p><h3>{selected.label}</h3><p>{TYPE_INFO[selected.type as EntityType]?.label ?? selected.type} · {STATUS_INFO[selected.status as Status]?.label ?? selected.status}</p><p>Связей: {selectedEdges.length}</p><Link href={`/entity/${selected.id}`}>ОТКРЫТЬ ЗАПИСЬ ↗</Link><button type="button" onClick={focusSelected}>ПОКАЗАТЬ НА КАРТЕ ⌖</button><button type="button" onClick={() => setSelectedId(null)}>СБРОСИТЬ ВЫБОР</button></div> : <p className="graph-help">Выберите узел на карте или в списке, чтобы увидеть сведения.</p>}
        <div className="graph-list-title">ЗАПИСИ <span>{filtered.length} / {nodes.length}</span></div><ul className="graph-list" aria-label="Узлы графа">{filtered.map((node) => <li key={node.id}><button type="button" aria-pressed={node.id === selectedId} onClick={() => setSelectedId(node.id)}><span>{node.label}</span><small>{TYPE_INFO[node.type as EntityType]?.label ?? node.type}</small></button></li>)}</ul>{filtered.length === 0 ? <p className="graph-help">Ничего не найдено.</p> : null}
      </div>
    </div>
  </section>;
}
