import type { Metadata } from "next";
import Link from "next/link";
import { DATE_CERTAINTY_LABELS, DATE_PRECISION_LABELS, type DateCertainty, type DatePrecision } from "@archon/lore-schema";
import type { TimelineItem } from "@archon/lore-indexer";
import { StatusStamp } from "@/components/ui";
import { getKb, timelineForSite } from "@/lib/lore";
import type { Status } from "@archon/lore-schema";

export const metadata: Metadata = { title: "Хронология" };

function Item({ item, summary }: { item: TimelineItem; summary?: string }) {
  const range = item.start ? (item.end ? `${item.start} — ${item.end}` : item.start) : null;
  return (
    <li>
      <p className="eyebrow">
        {DATE_PRECISION_LABELS[item.precision as DatePrecision]}
        {range ? <> {"//"} <b>{range}</b></> : null} {"//"} достоверность: {DATE_CERTAINTY_LABELS[item.certainty as DateCertainty].toLowerCase()}
      </p>
      <h3>
        <Link href={`/entity/${item.id}`}>{item.title}</Link> <StatusStamp status={item.status as Status} />
      </h3>
      {summary ? <p>{summary}</p> : null}
      {item.note ? <p className="mono" style={{ fontSize: 12 }}>{item.note}</p> : null}
    </li>
  );
}

export default function TimelinePage() {
  const kb = getKb();
  const { dated, undated } = timelineForSite(kb);
  const summary = (id: string) => kb.byId.get(id)?.fm.summary;

  return (
    <>
      <p className="eyebrow">
        <b>Хронология</b> {"//"} {dated.length + undated.length} событий
      </p>
      <h1 className="page-title">Хронология</h1>
      <p className="lead">
        Единая система временных событий. Календарь и эпоха вселенной пока не определены, поэтому глобальная последовательность не строится: события без известной даты показаны отдельно и не упорядочены.
      </p>
      <hr className="rule" />

      <div className="section-head">
        <h2>С известной датой</h2>
      </div>
      {dated.length ? (
        <ol className="timeline">
          {dated.map((e) => (
            <Item key={e.id} item={e} summary={summary(e.id)} />
          ))}
        </ol>
      ) : (
        <div className="empty">Событий с датой в григорианском календаре пока нет.</div>
      )}

      <div className="section-head">
        <h2>Дата неизвестна · порядок не определён</h2>
      </div>
      {undated.length ? (
        <ol className="timeline undated">
          {undated.map((e) => (
            <Item key={e.id} item={e} summary={summary(e.id)} />
          ))}
        </ol>
      ) : (
        <div className="empty">Нет событий.</div>
      )}
    </>
  );
}
