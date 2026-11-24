"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { STATUS_INFO, TYPE_INFO, type EntityType, type Status } from "@archon/lore-schema";
import { SEARCH_GROUPS, searchEntries, searchSnippet, type SearchEntry } from "@/lib/search";
import { LinkPending } from "./LinkPending";

export function SearchClient({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const results = useMemo(() => searchEntries(entries, query, scope, type, status), [entries, query, scope, type, status]);
  const types = [...new Set(entries.flatMap((entry) => entry.entityType ? [entry.entityType] : []))];
  const statuses = [...new Set(entries.flatMap((entry) => entry.entityStatus ? [entry.entityStatus] : []))];
  const reset = () => { setQuery(""); setScope(""); setType(""); setStatus(""); };

  return <div className="archive-search">
    <div className="search-intro"><div><p className="section-kicker">АРХИВ / МАСТЕРСКАЯ / ОБРАЗЫ</p><p>Названия, ID и тексты опубликованных записей; публичные гипотезы и концепции; промпты визуальных исследований. Рабочие идеи отделены от архива.</p></div><span>{entries.length} МАТЕРИАЛОВ</span></div>
    <div className={`search-controls${scope === "archive" ? " search-controls-archive" : ""}`} role="search">
      <div className="search-query"><label htmlFor="archive-search-query">ПОИСК ПО АРХИВУ</label><input id="archive-search-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например, Элеон или H-006" /></div>
      <div className="search-scope"><label htmlFor="archive-search-scope">ИСТОЧНИК</label><select id="archive-search-scope" value={scope} onChange={(event) => { setScope(event.target.value); setType(""); setStatus(""); }}><option value="">Все материалы</option>{SEARCH_GROUPS.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}</select></div>
      {scope === "archive" ? <><div><label htmlFor="archive-search-type">ТИП ЗАПИСИ</label><select id="archive-search-type" value={type} onChange={(event) => setType(event.target.value)}><option value="">Все типы</option>{types.map((t) => <option key={t} value={t}>{TYPE_INFO[t as EntityType]?.label ?? t}</option>)}</select></div><div><label htmlFor="archive-search-status">СТАТУС ЗАПИСИ</label><select id="archive-search-status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Все статусы</option>{statuses.map((s) => <option key={s} value={s}>{STATUS_INFO[s as Status]?.label ?? s}</option>)}</select></div></> : null}
    </div>
    <div className="search-result-meta"><p aria-live="polite">НАЙДЕНО <b>{results.length}</b> / {entries.length}</p>{query || scope || type || status ? <button type="button" onClick={reset}>СБРОСИТЬ ФИЛЬТРЫ ×</button> : null}</div>
    {results.length === 0 ? <div className="empty">Ничего не найдено. Попробуйте другое слово или сбросьте фильтры.</div> : SEARCH_GROUPS.map((group) => {
      const matches = results.filter((entry) => entry.scope === group.id);
      if (!matches.length) return null;
      return <section className="search-group" key={group.id} aria-labelledby={`search-group-${group.id}`}>
        <div className="search-group-heading"><div><p className="section-kicker">{group.id === "archive" ? "01 / АРХИВ" : "02 / МАСТЕРСКАЯ"}</p><h2 id={`search-group-${group.id}`}>{group.title}</h2><p>{group.notice}</p></div><span>{String(matches.length).padStart(2, "0")}</span></div>
        <div className="search-results">{matches.map((entry) => {
          const snippet = searchSnippet(entry.body, query);
          return <Link href={entry.href} key={`${entry.scope}-${entry.id}`} className="search-result"><LinkPending /><div className="search-result-meta-line"><span>{entry.label}</span><span>{entry.id.toUpperCase()}</span></div><h3>{entry.title}</h3><p>{entry.summary}</p>{snippet ? <p className="search-result-snippet"><span>ИЗ ТЕКСТА СТАТЬИ</span>{snippet}</p> : null}<div className="search-result-bottom"><span>{entry.status}</span><span aria-hidden="true">↗</span></div></Link>;
        })}</div>
      </section>;
    })}
  </div>;
}
