# Archon Universe Platform

Монорепозиторий научно-фантастической вселенной **«Архон» (Archon)**: база знаний, инструменты проверки канона, сайт-энциклопедия, инфраструктура для AI-агентов и (в будущем) игр.

> **Один источник знаний — множество способов его использования.**
> Источник истины — Markdown + YAML в [`universe/`](universe/). Всё остальное — производные.

Статус: Этапы **Foundation** и **Knowledge Base MVP** завершены, **Encyclopedia MVP** запущен. Подробности — [`ROADMAP.md`](ROADMAP.md), аудит — [`PROJECT_AUDIT.md`](PROJECT_AUDIT.md).

## Быстрый старт

Требуется Node.js ≥ 20.9 и npm; для разработки и CI используется Node.js 22 (см. `.nvmrc`).

```bash
npm install

# База знаний
npx tsx scripts/lore.ts validate      # полная проверка (0 ошибок = ок)
npx tsx scripts/lore.ts build         # validate + index + graph + report → build/lore/
npx vitest run                        # тесты

# Энциклопедия (читает universe/ напрямую)
npm run dev                           # http://localhost:3000
npm run build && npm run start
```

Команды CLI (`scripts/lore.ts`): `validate` · `index` · `graph` · `check-links` · `report` · `build`.
Выходные файлы: `build/lore/{index,graph,timeline,diagnostics}.json`, `build/lore/contradictions.md`; реестр сущностей обновляется в `universe/00-meta/Реестр сущностей.md` (команда `index`).

> Страницы энциклопедии формируются из файлов при сборке, но проект пока не настроен как статический экспорт: динамический `/api/health` использует PostgreSQL и `DATABASE_URL`. Перед деплоем выберите режим хостинга и проверьте доступность `universe/` в окружении сборки и сервера. Для проверки endpoint нужна работающая БД.
>
> Полный реестр сущностей доступен в репозитории, но не публикуется на сайте: он включает также `draft` и `archived`. Остальные мета-заметки публикуются целиком — не помещайте в них приватные данные.

## Obsidian

Откройте **корень репозитория** как Vault (*Open folder as vault*). Платные и сторонние плагины не нужны. Стартовая точка — [`universe/00-meta/Вселенная Архон.md`](universe/00-meta/Вселенная%20Архон.md). Шаблоны — `templates/` (core-плагин *Templates* уже настроен). Контент не зависит от Obsidian: это обычный Markdown, вики-ссылки `[[Название]]` разбираются и самим проектом.

## Структура

```
universe/    канон: 00-meta, 01-cosmology, 03-locations, 04-characters, 07-technology, 08-events
templates/   шаблоны сущностей          drafts/   идеи до утверждения (не публикуются)
packages/    lore-schema · lore-parser · lore-validator · lore-indexer
scripts/     CLI lore.ts                tests/    Vitest
src/         энциклопедия (Next.js)     docs/     ТЗ-первоисточник, ADR, руководства
```

Полное описание и отличия от ТЗ: [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Как добавить сущность

1. Убедитесь, что такой сущности ещё нет (поиск по `id`/`title`/`aliases`).
2. Скопируйте шаблон из `templates/` в нужную папку `universe/NN-…/` (в Obsidian: *Insert template*), назовите файл русским названием: `Название Сущности.md`.
3. Заполните `id` (постоянный, `тип-kebab-case`), `title`, `type`, `status` (новые — не выше `review`), даты.
4. Пишите только известное; неизвестное — в «Противоречия и неизвестные сведения».
5. `npx tsx scripts/lore.ts validate` → PR. Подробно: [`docs/worldbuilding/ENTITY-GUIDE.md`](docs/worldbuilding/ENTITY-GUIDE.md).

## Как работать с AI-агентами

Прочитать [`AGENTS.md`](AGENTS.md) и [`docs/agent-workflows/ROLES.md`](docs/agent-workflows/ROLES.md). Агенты предлагают черновики в `drafts/` и PR; канон утверждает человек.

## Документация

[`AGENTS.md`](AGENTS.md) · [`ROADMAP.md`](ROADMAP.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`CONTRIBUTING.md`](CONTRIBUTING.md) · [`CHANGELOG.md`](CHANGELOG.md) · [`PROJECT_AUDIT.md`](PROJECT_AUDIT.md) · [`CONTENT_MIGRATION.md`](CONTENT_MIGRATION.md) · [`docs/`](docs/)
