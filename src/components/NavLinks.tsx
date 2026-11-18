"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/universe", label: "Вселенная" },
  { href: "/characters", label: "Персонажи" },
  { href: "/locations", label: "Локации" },
  { href: "/technology", label: "Технологии" },
  { href: "/organizations", label: "Организации" },
  { href: "/events", label: "События" },
  { href: "/archive", label: "Архив" },
  { href: "/concepts", label: "Концепции" },
  { href: "/timeline", label: "Хронология" },
  { href: "/connections", label: "Связи" },
  { href: "/search", label: "Поиск" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Основная навигация">
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
