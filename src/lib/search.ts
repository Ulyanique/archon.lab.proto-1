/** Публичный индекс: каждый результат сохраняет происхождение и статус. */
export type SearchScope = "archive" | "hypothesis" | "draft" | "art";
export interface SearchEntry {
  id: string;
  title: string;
  href: string;
  scope: SearchScope;
  label: string;
  status: string;
  summary: string;
  terms: string[];
  /** Видимый текст опубликованной статьи, без метаданных и адресов ссылок. */
  body?: string;
  entityType?: string;
  entityStatus?: string;
}

export const SEARCH_GROUPS: { id: SearchScope; title: string; notice: string }[] = [
  { id: "archive", title: "Записи архива", notice: "Опубликованные записи; статус указан у каждой." },
  { id: "hypothesis", title: "Гипотезы", notice: "Предложения для обсуждения, не канон." },
  { id: "draft", title: "Рабочие концепции", notice: "Публичные черновики, не канон." },
  { id: "art", title: "Концепт-арт", notice: "Визуальные исследования, не факты канона." },
];

export function normalizeSearch(text: string): string {
  return text.normalize("NFC").toLocaleLowerCase("ru").replace(/ё/g, "е").trim();
}

/** Все слова должны встретиться; точный ID и название выше совпадений в тексте. */
export function searchEntries(entries: SearchEntry[], query: string, scope = "", type = "", status = ""): SearchEntry[] {
  const normalized = normalizeSearch(query);
  const words = normalized.split(/\s+/).filter(Boolean);
  return entries.filter((entry) => (!scope || entry.scope === scope) && (!type || entry.entityType === type) && (!status || entry.entityStatus === status))
    .map((entry) => {
      const id = normalizeSearch(entry.id);
      const title = normalizeSearch(entry.title);
      const haystack = normalizeSearch([entry.id, entry.title, entry.summary, entry.body ?? "", ...entry.terms].join(" "));
      if (!words.every((word) => haystack.includes(word))) return null;
      const score = normalized && id === normalized ? 0 : normalized && title.includes(normalized) ? 1 : 2;
      return { entry, score };
    })
    .filter((result): result is { entry: SearchEntry; score: number } => result !== null)
    .sort((a, b) => a.score - b.score || a.entry.title.localeCompare(b.entry.title, "ru"))
    .map(({ entry }) => entry);
}

/** Фрагмент видимого текста, когда хотя бы одно слово запроса встречается в статье. */
export function searchSnippet(body: string | undefined, query: string, maxLength = 170): string | null {
  if (!body || !query.trim() || maxLength < 1) return null;
  const text = body.normalize("NFC").replace(/\s+/g, " ").trim();
  const lower = normalizeSearch(text);
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const positions = words.map((word) => lower.indexOf(word)).filter((index) => index >= 0);
  if (!positions.length) return null;
  const position = Math.min(...positions);
  const rawStart = Math.max(0, position - Math.floor(maxLength / 3));
  const nextSpace = text.indexOf(" ", rawStart);
  const start = rawStart > 0 && nextSpace >= 0 && nextSpace < position ? nextSpace + 1 : rawStart;
  const rawEnd = Math.min(text.length, start + maxLength);
  const lastSpace = text.lastIndexOf(" ", rawEnd);
  const end = rawEnd < text.length && lastSpace > position ? lastSpace : rawEnd;
  return `${start ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}
