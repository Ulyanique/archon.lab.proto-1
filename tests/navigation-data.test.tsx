import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { navigation } from "../src/lib/navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/diaries", useRouter: () => ({ prefetch: () => {} }) }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("../src/components/LinkPending", () => ({ LinkPending: () => null }));
import { NavLinks } from "../src/components/NavLinks";

describe("данные навигации", () => {
  it("включает все разделы единожды в полном меню", () => {
    const items = navigation.groups.flatMap((group) => group.items);
    expect(new Set(items.map((item) => item.href)).size).toBe(items.length);
    expect(items.find((item) => item.href === "/diaries")?.label).toBe("Дневники Харпера");
    expect(navigation.quick.every((item) => items.some((full) => full.href === item.href && full.label === item.label))).toBe(true);
  });
  it("использует данные, переданные сервером, а не вшитый в браузер список", () => {
    const snapshot = { quick: [], groups: [{ title: "Проверка", items: [{ href: "/example", label: "Серверный пункт" }] }] };
    const html = renderToStaticMarkup(<NavLinks navigation={snapshot} />);
    expect(html).toContain('href="/example"');
    expect(html).toContain("Серверный пункт");
    expect(html).not.toContain("Дневники Харпера");
  });
});
