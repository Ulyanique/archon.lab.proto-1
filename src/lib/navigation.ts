/** Данные меню формируются сервером и передаются клиентской оболочке вместе с HTML. */
export interface NavigationItem { href: string; label: string }
export interface NavigationGroup { title: string; items: NavigationItem[] }
export interface NavigationData { quick: NavigationItem[]; groups: NavigationGroup[] }

const studio = { href: "/studio", label: "Студия" };
const book = { href: "/book", label: "Книга" };
const stories = { href: "/stories", label: "Истории" };
const diaries = { href: "/diaries", label: "Дневники Харпера" };
const universe = { href: "/universe", label: "Вселенная" };
const archive = { href: "/archive", label: "Архив" };
const hypotheses = { href: "/hypotheses", label: "Гипотезы" };
const search = { href: "/search", label: "Поиск" };
export const navigation: NavigationData = {
  quick: [studio, universe, archive, hypotheses, search],
  groups: [
    { title: "ИССЛЕДОВАТЬ МИР", items: [universe, { href: "/characters", label: "Персонажи" }, { href: "/locations", label: "Локации" }, { href: "/technology", label: "Технологии" }, { href: "/organizations", label: "Организации" }, { href: "/events", label: "События" }] },
    { title: "АРХИВ И СВЯЗИ", items: [archive, { href: "/timeline", label: "Хронология" }, { href: "/connections", label: "Связи" }, search] },
    { title: "МАСТЕРСКАЯ / НЕ КАНОН", items: [studio, book, stories, diaries, { href: "/concepts", label: "Концепции" }, hypotheses, { href: "/concept-art", label: "Концепт-арт" }, { href: "/inspiration", label: "Вдохновение" }] },
  ],
};
