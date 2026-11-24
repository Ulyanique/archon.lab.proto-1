"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { filterHypotheses, type HypothesisListItem } from "@/lib/hypothesis-filter";
import { LinkPending } from "./LinkPending";

export function HypothesisList({ items }: { items: HypothesisListItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const statuses = [...new Set(items.map((item) => item.status))];
  const results = useMemo(() => filterHypotheses(items, query, status), [items, query, status]);
  return <section className="hypothesis-catalog" id="hypothesis-list" aria-labelledby="hypothesis-list-title">
    <div className="hypothesis-catalog-heading"><div><p className="section-kicker">РЕЕСТР / ВСЕ ПРЕДЛОЖЕНИЯ</p><h2 id="hypothesis-list-title">Каталог гипотез</h2><p>Ищите по ID, названию или краткому описанию. Статус относится к реестру, а не к личному черновику.</p></div><span>{String(items.length).padStart(2, "0")} ИДЕЙ</span></div>
    <div className="hypothesis-filters" role="search" aria-label="Поиск по гипотезам">
      <div><label htmlFor="hypothesis-query">ПОИСК ПО ГИПОТЕЗАМ</label><input id="hypothesis-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например, H-006 или Луна" /></div>
      <div><label htmlFor="hypothesis-status">СТАТУС РЕЕСТРА</label><select id="hypothesis-status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Все статусы</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
    </div>
    <div className="hypothesis-filter-meta"><p role="status" aria-live="polite">ПОКАЗАНО <b>{results.length}</b> ИЗ {items.length}</p>{query || status ? <button type="button" onClick={() => { setQuery(""); setStatus(""); }}>СБРОСИТЬ ФИЛЬТРЫ ×</button> : null}</div>
    {results.length === 0 ? <div className="empty">Ничего не найдено. Попробуйте другой запрос или сбросьте фильтры.</div> : <div className="workshop-list">{results.map((h) => <Link href={`/hypotheses/${h.id}`} className="hypothesis-card" key={h.id}>
      <LinkPending /><div className="hypothesis-meta"><span>{h.id}</span><span>{h.status}</span></div><h3>{h.title}</h3><p>{h.summary || "Откройте гипотезу, чтобы прочитать подробности."}</p><div className="hypothesis-bottom"><span>{h.referencesCount ? `СВЯЗЕЙ: ${h.referencesCount}` : "БЕЗ ССЫЛОК НА ДРУГИЕ ГИПОТЕЗЫ"}</span><span aria-hidden="true">↗</span></div>
    </Link>)}</div>}
  </section>;
}
