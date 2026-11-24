import { STATUS_INFO, TYPE_INFO } from "@archon/lore-schema";
import { getKb, publishedIndex } from "./lore";
import { renderDocument } from "./markdown";
import { visibleTextFromHtml } from "./visible-text";
import { getDraftConcepts, getHypotheses } from "./workshop";
import { getConceptArt } from "./concept-art";
import { getBookChapter, getBookOpenings } from "./book";
import { getDiaries } from "./diaries";
import { getStories } from "./stories";
import type { SearchEntry } from "./search";

/** Никаких других drafts и неопубликованных сущностей; только те источники, которые уже видны в UI. */
export function getPublicSearchEntries(): SearchEntry[] {
  const kb = getKb();
  const archive: SearchEntry[] = publishedIndex(kb).map((item) => ({
    id: item.id, title: item.title, href: `/entity/${item.id}`, scope: "archive", label: TYPE_INFO[item.type].label,
    status: STATUS_INFO[item.status].label, summary: item.summary ?? "", terms: [...item.aliases, ...item.tags],
    body: visibleTextFromHtml(renderDocument(kb, kb.byId.get(item.id)!.doc)), entityType: item.type, entityStatus: item.status,
  }));
  const hypotheses: SearchEntry[] = getHypotheses().map((item) => ({
    id: item.id, title: item.title, href: `/hypotheses/${item.id}`, scope: "hypothesis", label: "Гипотеза / не канон",
    status: item.status, summary: item.summary, terms: [item.doc.body],
  }));
  const drafts: SearchEntry[] = getDraftConcepts().map((item) => ({
    id: item.slug, title: item.title, href: `/concept-drafts/${item.slug}`, scope: "draft", label: "Рабочая концепция / не канон",
    status: "черновик", summary: "Публичная концепция в разработке.", terms: [item.doc.body],
  }));
  const stories: SearchEntry[] = getStories().map((story) => ({
    id: story.id, title: story.title, href: `/stories/${story.id}`, scope: "draft", label: "История / не канон",
    status: "черновик", summary: story.summary, terms: [...story.openQuestions, ...story.scenes.flatMap((scene) => [scene.id, scene.title, scene.purpose, ...scene.openQuestions, ...scene.knowledge.flatMap((item) => [item.role, item.known, item.unknown])])],
  }));
  const diaries: SearchEntry[] = getDiaries().map((entry) => ({ id: entry.id, title: entry.title, href: `/diaries#${entry.id}`, scope: "draft", label: "Дневник Харпера / не канон", status: "художественный черновик", summary: entry.summary, body: entry.paragraphs.join("\n\n"), terms: [entry.id, "Харпер", "дневник", ...entry.hypothesisIds] }));
  const chapter = getBookChapter();
  const book: SearchEntry[] = [{ id: chapter.id, title: chapter.title, href: "/book#chapter-01", scope: "draft", label: "Глава книги / не канон", status: "художественный черновик", summary: "Начало книги: Харпер обнаруживает пропуск в журнале.", body: visibleTextFromHtml(renderDocument(kb, chapter.doc)), terms: ["книга Архона", "Харпер", "Две минуты"] }];
  const openings: SearchEntry[] = getBookOpenings().map((opening) => ({ id: opening.id, title: opening.title, href: `/book/openings#${opening.id}`, scope: "draft", label: "Вариант начала книги / не канон", status: "художественный черновик", summary: opening.summary, body: visibleTextFromHtml(renderDocument(kb, opening.doc)), terms: ["книга", "Харпер", opening.approach] }));
  const art: SearchEntry[] = getConceptArt().map((item) => ({
    id: item.id, title: item.title, href: `/concept-art#${item.id}`, scope: "art", label: "Концепт-арт / не канон",
    status: "визуальное исследование", summary: item.description, terms: [item.category, item.prompt, item.alt],
  }));
  return [...archive, ...hypotheses, ...drafts, ...stories, ...diaries, ...book, ...openings, ...art];
}
