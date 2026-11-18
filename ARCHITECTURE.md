# ARCHITECTURE — Archon Universe Platform

Принцип: **один источник знаний — множество способов использования.**
Источник истины — Markdown + YAML в `universe/`. Всё остальное (индексы, граф, сайт, будущая игра) — производные, которые перестраиваются из него.

```
Markdown + YAML (universe/)          ← единственный источник истины
        │
        ▼
lore-parser   → структурированные документы (frontmatter, ссылки, разделы)
        │
        ├──▶ lore-validator → диагностика, отчёт о противоречиях  (CI-гейт)
        ├──▶ lore-indexer   → build/lore/*.json, граф, реестр сущностей
        ├──▶ Encyclopedia   → статический сайт (Next.js, src/)
        └──▶ [позже] Game / Editor / Tools / RAG
```

## 1. Итоговая структура монорепозитория

Корень репозитория одновременно является **Obsidian Vault** и корнем Next.js-приложения.

```
archon-universe/
├── README.md  AGENTS.md  ROADMAP.md  ARCHITECTURE.md
├── PROJECT_AUDIT.md  CONTENT_MIGRATION.md  CHANGELOG.md  CONTRIBUTING.md
│
├── universe/                 # КАНОН (единственный источник истины)
│   ├── 00-meta/              # правила, стиль, открытые вопросы, реестр (не сущности)
│   ├── 01-cosmology/         # концепции уровня вселенной
│   ├── 03-locations/
│   ├── 04-characters/        # персонажи и ИИ
│   ├── 07-technology/
│   ├── 08-events/            # события = записи хронологии
│   └── …                     # остальные папки ТЗ §8 создаются по факту появления материала
│
├── templates/                # шаблоны сущностей (Obsidian Templates, core-плагин)
├── drafts/                   # идеи до утверждения; НЕ публикуются, НЕ валидируются как канон
├── assets/                   # медиа (LFS-правила в .gitattributes)
├── docs/
│   ├── source/               # неизменный первоисточник (ТЗ)
│   ├── architecture/         # описание реализованных компонентов
│   ├── decisions/            # ADR
│   ├── worldbuilding/        # правила создания лора
│   └── agent-workflows/      # роли и процессы агентов
│
├── packages/                 # framework-независимая логика знаний
│   ├── lore-schema/          # Zod-схемы, типы, статусы, типы связей
│   ├── lore-parser/          # файлы → документы
│   ├── lore-validator/       # проверки + отчёт о противоречиях
│   └── lore-indexer/         # индексы, граф, хронология, реестр
├── scripts/lore.ts           # CLI: validate | index | graph | check-links | report | build
├── tests/                    # Vitest (юнит + проверка реальной базы)
│
├── src/                      # Encyclopedia MVP (Next.js App Router) + /api/health
├── .github/                  # workflows (validate, test), шаблоны issue/PR
└── .obsidian/                # опциональные настройки Vault
```

### Планируемые, но **ещё не созданные** каталоги (ТЗ §8)

Создаются только когда в них появляется реальное содержимое:

| Каталог | Когда | Этап |
|---|---|---|
| `universe/02-timeline, 05-factions, 06-organizations, 09-artifacts, 10-cultures, 11-religions, 12-stories` | при появлении первой сущности соответствующего типа | по мере лора |
| `drafts/{inbox,concepts,research,pending-review,abandoned}` | при первом черновике (описаны в `drafts/README.md`) | 1 |
| `apps/editor`, `apps/tools` | визуальные инструменты | 6 |
| `projects/game` (+ `interactive-fiction`, `music`, `applications`) | игровая архитектура | 7 |
| `packages/shared` | только если появится реально общий код | — |
| `.github/workflows/deploy.yml` | после выбора хостинга (Q-17) | 3+ |

### Отличия от структуры ТЗ §8 (все — в ADR)

| ТЗ | Реализация | Причина | ADR |
|---|---|---|---|
| Astro, `apps/encyclopedia` | Next.js в корне, `src/` | Окружение/приёмка: Next.js + `npm run build` | [0001](docs/decisions/0001-stack-adaptation.md) |
| pnpm workspaces | единый `package.json` + алиасы `@archon/*` | pnpm недоступен, `package.json` не правится вручную | [0001](docs/decisions/0001-stack-adaptation.md) |
| 4 отдельных скрипта | один `scripts/lore.ts` | меньше дублирования загрузки/диагностики | [0001](docs/decisions/0001-stack-adaptation.md) |
| `packages/shared` | не создан | нет общего кода (запрещены пустые абстрактные модули) | — |
| `LICENSE` | не создан | лицензию выбирает владелец (Q-14) | — |

## 2. Модель знаний

Подробно — [`docs/architecture/knowledge-base.md`](docs/architecture/knowledge-base.md).

- **Сущность** = один `.md` файл с YAML-frontmatter в `universe/` (кроме `00-meta/`).
- **ID** (`character-alexei-harper`) постоянен, не зависит от имени файла и заголовка; формат `<префикс>-<kebab-case>`.
- **Типы** (15): `character ai location organization faction technology event artifact species culture religion vehicle document story concept`.
- **Статусы** (7) с чёткой семантикой: `draft proposed review canon deprecated archived unresolved`.
- **Связи** берутся из трёх источников, ни один не дублируется вручную:
  1. `related:` — плоский список ID (тип `related`);
  2. `relations:` — типизированные связи `{type, target, note}` (реестр типов расширяемый);
  3. `[[вики-ссылки]]` в теле (тип `mention`), а также `participants/place/technologies` у событий.
- **Хронология** — события (`type: event`) с блоком `date` (`exact | approximate | range | unknown`) и необязательным `after:` для частичного порядка. Глобальная хронология не вычисляется и не придумывается.
- **Научный статус** технологий: `science_status` = `real | theoretical | fictional-assumption | unexplained | unassessed`.

## 3. Разделение слоёв

| Слой | Где | Можно ли смешивать |
|---|---|---|
| Lore (канон) | `universe/` | — |
| Game Data (характеристики) | будущий `projects/game/` | **нет**: лор не превращается в игровые классы |
| Game Engine | будущий `projects/game/` | нет |
| Представление | `src/`, будущие `apps/*` | только читает |

## 4. Публикация и приватность

- Сайт публикует статусы `canon, review, unresolved, proposed, deprecated`; **не** публикует `draft` и `archived`.
- `drafts/` никогда не читается энциклопедией.
- Ссылки на непубликуемые сущности на сайте отображаются как обычный текст.

## 5. Статика вместо сервера

Энциклопедия читает `universe/` на этапе сборки. Runtime-зависимостей от БД нет. PostgreSQL/Drizzle остаются в каркасе только ради `/api/health` платформы.

## 6. Расширяемость

- Новый тип сущности → `lore-schema` (enum + префикс + папка), шаблон в `templates/`.
- Новый тип связи → одна запись в реестре `RELATION_TYPES`.
- Новый потребитель (игра, RAG, редактор) → импортирует `@archon/lore-parser` и работает со структурированными документами.
