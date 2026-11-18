# ADR-0001 — Адаптация стека ТЗ к рабочему окружению

- Статус: принято (временно), ожидает подтверждения владельцем (Q-2)
- Дата: 2026-11-18

## Контекст

ТЗ §17 предпочитает Astro + pnpm workspaces, но подчёркивает: «стек предпочтительный, а не абсолютный». Рабочее пространство — готовый Next.js 16 проект (npm, Tailwind, Drizzle). Приёмка репозитория выполняется командами `npm run build` и healthcheck `/api/health`; pnpm и git-lfs в окружении отсутствуют; `package.json` не правится вручную.

## Решение

1. **Энциклопедия** — Next.js (App Router, статическая генерация), расположена в корне (`src/`), а не в `apps/encyclopedia`.
2. **Пакеты** — `packages/lore-{schema,parser,validator,indexer}` как TypeScript-модули с алиасами `@archon/*` в `tsconfig.json` и `vitest.config.mts`. Единый корневой `package.json`.
3. **CLI** — единый `scripts/lore.ts` (`npx tsx scripts/lore.ts <команда>`) вместо четырёх отдельных скриптов.
4. **Фреймворк-независимость базы знаний**: `packages/*` не импортируют Next.js, React и Obsidian. Единственный потребитель Next.js — `src/lib/lore.ts`.
5. Каркас PostgreSQL/Drizzle и `/api/health` сохранены без изменений; энциклопедия их не использует.
6. `tsx`, `vitest`, `zod`, `yaml`, `marked` установлены в `dependencies` (инструмент установки не различает dev/prod).

## Последствия

- (+) Всё собирается и проверяется в текущем окружении; CI = те же команды.
- (+) Замена Astro/Next.js затрагивает только `src/`.
- (−) Пакеты не изолированы на уровне `package.json`; нет версионирования между ними.
- (−) Нет `npm run lore:*` — команды вызываются через `npx tsx`.

## Путь миграции к ТЗ

1. Добавить `pnpm-workspace.yaml`, `package.json` в `packages/*`, заменить алиасы на workspace-зависимости.
2. Создать `apps/encyclopedia` (Astro), перенести страницы; `packages/*` остаются без изменений.
3. Добавить скрипты в корневой `package.json` (`lore:validate` и др.).
