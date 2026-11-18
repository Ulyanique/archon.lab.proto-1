import type { Metadata } from "next";
import { SearchClient } from "@/components/SearchClient";
import { publishedIndex } from "@/lib/lore";

export const metadata: Metadata = { title: "Поиск" };

export default function SearchPage() {
  const entries = publishedIndex().map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    status: e.status,
    summary: e.summary,
    aliases: e.aliases,
    tags: e.tags,
  }));
  return (
    <>
      <p className="eyebrow">
        <b>Поиск</b> {"//"} по названиям, алиасам, тегам и описаниям
      </p>
      <h1 className="page-title">Поиск</h1>
      <SearchClient entries={entries} />
    </>
  );
}
