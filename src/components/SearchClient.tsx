"use client";

import { useMemo, useState } from "react";
import { STATUS_INFO, TYPE_INFO, type EntityType, type Status } from "@archon/lore-schema";
import { EntityCard } from "@/components/ui";

export interface SearchEntry {
  id: string;
  title: string;
  type: EntityType;
  status: Status;
  summary: string | null;
  aliases: string[];
  tags: string[];
}

const norm = (s: string) => s.normalize("NFC").toLowerCase().replace(/ё/g, "е");

export function SearchClient({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const results = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    return entries
      .filter((e) => (!type || e.type === type) && (!status || e.status === status))
      .map((e) => {
        const haystack = norm([e.title, e.id, e.summary ?? "", ...e.aliases, ...e.tags].join(" "));
        if (!words.every((w) => haystack.includes(w))) return null;
        const titleHit = words.some((w) => norm(e.title).includes(w) || e.aliases.some((a) => norm(a).includes(w)));
        return { e, score: titleHit ? 0 : 1 };
      })
      .filter((x): x is { e: SearchEntry; score: number } => x !== null)
      .sort((a, b) => a.score - b.score || a.e.title.localeCompare(b.e.title, "ru"))
      .map((x) => x.e);
  }, [entries, query, type, status]);

  const types = [...new Set(entries.map((e) => e.type))];
  const statuses = [...new Set(entries.map((e) => e.status))];

  return (
    <>
      <div className="field" role="search">
        <input
          type="search"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          placeholder="Имя, алиас, ID, тег или слово из описания…"
          aria-label="Поиск по архиву"
          autoFocus
        />
        <select value={type} onChange={(ev) => setType(ev.target.value)} aria-label="Тип">
          <option value="">Все типы</option>
          {types.map((t) => (
            <option key={t} value={t}>{TYPE_INFO[t].label}</option>
          ))}
        </select>
        <select value={status} onChange={(ev) => setStatus(ev.target.value)} aria-label="Статус">
          <option value="">Все статусы</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{STATUS_INFO[s].label}</option>
          ))}
        </select>
      </div>
      <p className="eyebrow" aria-live="polite">Найдено: <b>{results.length}</b> из {entries.length}</p>
      {results.length === 0 ? (
        <div className="empty">Ничего не найдено. Проверьте написание или сбросьте фильтры.</div>
      ) : (
        <div className="grid">
          {results.map((e) => (
            <EntityCard key={e.id} item={e} />
          ))}
        </div>
      )}
    </>
  );
}
