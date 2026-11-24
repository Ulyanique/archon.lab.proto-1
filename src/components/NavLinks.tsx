"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LinkPending } from "./LinkPending";
import type { NavigationData, NavigationItem } from "@/lib/navigation";

export function NavLinks({ navigation }: { navigation: NavigationData }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => { if (event.target instanceof Node && !shell.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  const links = (items: NavigationItem[], inMenu: boolean) => items.map((item) =>
    <Link key={item.href} href={item.href} onPointerEnter={() => router.prefetch(item.href)} onFocus={() => router.prefetch(item.href)} onClick={() => inMenu && setOpen(false)} aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}>{item.label}<LinkPending /></Link>
  );
  return (
    <div className="nav-shell" ref={shell} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        event.currentTarget.querySelector<HTMLButtonElement>(".nav-toggle")?.focus();
      }
    }}>
      <nav className="nav" aria-label="Быстрые разделы">{links(navigation.quick, false)}</nav>
      <Link href="/search" className="nav-mobile-search" aria-label="Поиск по архиву">ПОИСК ↗</Link>
      <button className="nav-toggle" type="button" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>
        <span>{open ? "ЗАКРЫТЬ" : "РАЗДЕЛЫ"}</span><span aria-hidden="true">{open ? "×" : "+"}</span>
      </button>
      <nav id="mobile-navigation" className="mobile-nav-panel" aria-label="Основная навигация" hidden={!open}>
        <p className="nav-panel-title">АРХИВ / ВСЕ РАЗДЕЛЫ</p><div className="nav-groups">{navigation.groups.map((group) => <section key={group.title}><h2>{group.title}</h2><div>{links(group.items, true)}</div></section>)}</div>
      </nav>
    </div>
  );
}
