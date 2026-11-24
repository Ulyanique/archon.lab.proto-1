import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findRepoRoot, parseDocument } from "@archon/lore-parser";

/** Публичный текст произведения, отдельно от базы лора и сюжетных концепций. */
export function getBookChapter() {
  const path = "drafts/works/Архон — глава 1.md";
  const doc = parseDocument(path, readFileSync(join(findRepoRoot(), path), "utf8"));
  return { id: "book-archon-chapter-01", title: "Глава 1. Две минуты", doc };
}

/** Редакторские границы внутри неизменённого источника; порядок — не хронология мира. */
export function getBookFragments() {
  const chapter = getBookChapter();
  const body = chapter.doc.body.replace(/^\s*# .*\n?/, "").trim();
  const markers = ["Нина работала в соседнем помещении", "Он вернулся к себе и положил карточку"];
  const cuts = markers.map((marker) => {
    const index = body.indexOf(marker);
    if (index < 0 || body.indexOf(marker, index + marker.length) !== -1) throw new Error(`Неоднозначная граница фрагмента: ${marker}`);
    return index;
  });
  if (cuts[0] >= cuts[1]) throw new Error("Границы фрагментов книги идут не по порядку");
  return [
    { id: "book-piece-missing-minutes", title: "Две минуты", body: body.slice(0, cuts[0]).trim() },
    { id: "book-piece-nina", title: "Карточка у Нины", body: body.slice(cuts[0], cuts[1]).trim() },
    { id: "book-piece-deferred", title: "Отложено", body: body.slice(cuts[1]).trim() },
  ];
}

/** Три независимых начала для сравнения; имена и формулировки не устанавливают канон. */
export function getBookOpenings() {
  const items = [
    { id: "book-opening-lift", title: "Вариант A. Лифт", approach: "СРАЗУ В ДЕЙСТВИЕ", summary: "Незнакомая девочка застряла в дверях лифта. Харперу приходится искать помощь и действовать без привычной уверенности.", file: "01 — Лифт.md" },
    { id: "book-opening-minutes", title: "Вариант B. Две минуты", approach: "ЛИЧНАЯ ЗАГАДКА", summary: "Нина просит Харпера не открывать файл, который уже оказался у него на экране.", file: "02 — Две минуты.md" },
    { id: "book-opening-river", title: "Вариант C. Река", approach: "ТИХОЕ НАПРЯЖЕНИЕ", summary: "Школьный рисунок заставляет Харпера усомниться в том, что именно показывает карта.", file: "03 — Река.md" },
  ];
  return items.map((item) => {
    const path = `drafts/works/openings/${item.file}`;
    const doc = parseDocument(path, readFileSync(join(findRepoRoot(), path), "utf8"));
    if (doc.headings.find((heading) => heading.level === 1)?.text !== item.title) throw new Error(`Название начала не совпадает: ${path}`);
    return { ...item, doc };
  });
}

/** Продолжение варианта с лифтом — самостоятельный фрагмент, не канон. */
export function getLiftContinuation() {
  const path = "drafts/works/scenes/После лифта.md";
  const doc = parseDocument(path, readFileSync(join(findRepoRoot(), path), "utf8"));
  return { id: "book-piece-after-lift", title: "После лифта", doc };
}

/** Следующая сцена линии лифта, отдельный рабочий фрагмент. */
export function getArchiveScene() {
  const path = "drafts/works/scenes/Архив.md";
  const doc = parseDocument(path, readFileSync(join(findRepoRoot(), path), "utf8"));
  return { id: "book-piece-archive", title: "Архив", doc };
}

/** Новое сенсорное начало: отдельная версия, не замена прежних сцен. */
export function getDarkOpening() {
  const path = "drafts/works/openings/04 — Темнота.md";
  const doc = parseDocument(path, readFileSync(join(findRepoRoot(), path), "utf8"));
  return { id: "book-opening-dark", title: "Темнота", doc };
}
