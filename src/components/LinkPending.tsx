"use client";

import { useLinkStatus } from "next/link";

/** Instant, local feedback while the destination is being fetched. */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return pending ? <span className="link-pending" role="status" aria-label="Загрузка страницы" /> : null;
}
