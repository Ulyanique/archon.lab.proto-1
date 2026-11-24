import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { navigation } from "@/lib/navigation";
import { NavLinks } from "@/components/NavLinks";
import "@fontsource-variable/manrope";
import "@fontsource-variable/oswald";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Archon Encyclopedia", template: "%s · Archon Encyclopedia" },
  description: "Исследовательский архив вселенной «Архон»: энциклопедия, построенная из Markdown-файлов репозитория.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header className="topbar">
          <div className="shell topbar-inner">
            <Link href="/" className="brand">
              Archon
              <small>RESEARCH ARCHIVE</small>
            </Link>
            <NavLinks navigation={navigation} />
          </div>
        </header>
        <main className="shell">{children}</main>
        <footer className="footer">
          <div className="shell">
            <span>ARCHON UNIVERSE · энциклопедия строится из universe/*.md — источник истины не дублируется</span>
            <span>Статус записи ≠ канон: см. «Правила канона»</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
