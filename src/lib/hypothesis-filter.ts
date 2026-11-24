import { normalizeSearch } from "./search";

export interface HypothesisListItem { id: string; title: string; status: string; summary: string; referencesCount: number }

/** Поиск по видимой карточке и точному статусу реестра; пустые фильтры не скрывают записи. */
export function filterHypotheses(items: HypothesisListItem[], query: string, status: string): HypothesisListItem[] {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const text = normalizeSearch(`${item.id} ${item.title} ${item.summary}`);
    return (!status || item.status === status) && words.every((word) => text.includes(word));
  });
}
