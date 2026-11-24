import type { Metadata } from "next";
import { SearchClient } from "@/components/SearchClient";
import { getPublicSearchEntries } from "@/lib/search-index";

export const metadata: Metadata = { title: "Поиск" };

export default function SearchPage() {
  const entries = getPublicSearchEntries();
  return (
    <>
      <p className="eyebrow">
        <b>Поиск</b> {"//"} записи, идеи и визуальные исследования
      </p>
      <h1 className="page-title">Поиск</h1>
      <SearchClient entries={entries} />
    </>
  );
}
