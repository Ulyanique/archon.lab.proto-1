import Link from "next/link";
import { STATUS_INFO, TYPE_INFO, type Status, type EntityType } from "@archon/lore-schema";
import { LinkPending } from "./LinkPending";

export function StatusStamp({ status }: { status: Status }) {
  return (
    <span className={`stamp s-${status}`} title={STATUS_INFO[status].meaning}>
      {STATUS_INFO[status].label}
    </span>
  );
}

export interface CardData {
  id: string;
  title: string;
  type: EntityType;
  status: Status;
  summary?: string | null;
}

export function EntityCard({ item }: { item: CardData }) {
  return (
    <Link href={`/entity/${item.id}`} className="card">
      <LinkPending />
      <div className="meta">
        <span>{TYPE_INFO[item.type].label}</span>
        <StatusStamp status={item.status} />
      </div>
      <h3>{item.title}</h3>
      {item.summary ? <p>{item.summary}</p> : null}
    </Link>
  );
}

/** Предупреждение для материалов, не утверждённых как канон. */
export function CanonNotice({ status }: { status: Status }) {
  if (status === "canon") return null;
  return (
    <div className={`notice ${status === "unresolved" ? "unresolved" : ""}`} role="note">
      <strong>{STATUS_INFO[status].label}</strong>
      {STATUS_INFO[status].meaning}
    </div>
  );
}
