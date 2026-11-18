# База знаний: схема, парсер, валидатор, индексы

Описывает **реализованное** (Этап 2). Код: `packages/lore-*`, CLI: `scripts/lore.ts`, тесты: `tests/`.

## Пакеты

| Пакет | Назначение | Зависимости |
|---|---|---|
| `lore-schema` | Zod-схема frontmatter, типы, статусы (`STATUS_INFO`), типы связей (`RELATION_TYPES`), форматы ID/дат | zod |
| `lore-parser` | `.md` → `LoreDocument` (frontmatter, YAML-ошибки, вики/markdown-ссылки, разделы); загрузка базы с диска; извлечение связей (`extractEdges`) | yaml, lore-schema |
| `lore-validator` | `validateKnowledgeBase` → диагностика; `buildReport` → отчёт о противоречиях | lore-parser, lore-schema |
| `lore-indexer` | индекс, граф, хронология, реестр | lore-parser, lore-validator, lore-schema |

Приложения (сайт, игра, редактор) используют `lore-parser` и при необходимости остальные пакеты. Обратных зависимостей нет.

## Frontmatter

Обязательные: `id`, `title`, `type`, `status`, `created`, `updated`. Остальные необязательные.

| Поле | Описание |
|---|---|
| `id` | постоянный ID `префикс-kebab-case` |
| `type` | `character ai location organization faction technology event artifact species culture religion vehicle document story concept` |
| `status` | `draft proposed review canon deprecated archived unresolved` |
| `aliases`, `tags` | списки строк |
| `related` | список ID |
| `relations` | `[{type, target, note?}]` — типизированные связи |
| `summary` | краткое описание для каталогов и поиска |
| `superseded_by` | для `deprecated`: ID замены |
| `science_status` | только `technology`: `real theoretical fictional-assumption unexplained unassessed` |
| `date` | только `event`: `{precision, calendar, certainty, start?, end?, note?}` |
| `participants`, `place`, `technologies`, `after` | только `event`; ID сущностей/событий |

`precision`: `exact` (нужен `start`), `approximate` (нужен `start`), `range` (нужны `start`+`end`), `unknown` (дат нет).
`calendar`: `gregorian` (формат проверяется: `YYYY[-MM[-DD]]`), `in-universe`, `unspecified`.

## Связи

`extractEdges(kb)` — единственное место, где связи выводятся: `related` → `related`; `relations[]` → свой тип; `participants` → `participant`; `place` → `located-in`; `technologies` → `involves-technology`; `after` → `after`; `superseded_by` → `superseded-by`; вики-ссылки и md-ссылки в тексте → `mention`. Граф убирает `mention`, если пара уже связана явной связью.

## Диагностика валидатора

Серьёзность: `error` (блокирует CI), `warning` (с `--strict` тоже блокирует), `info`.

| Код | Sev | Значение |
|---|---|---|
| `FM001` | error | в `universe/` (вне `00-meta/`) нет frontmatter |
| `FM002` | error | frontmatter не объект |
| `YAML001` | error | невалидный YAML |
| `SCHEMA` | error | нарушение Zod-схемы (тип, статус, формат дат, неизвестное поле, поле события у не-события, …) |
| `ID-DUP` | error | ID не уникален |
| `ID-PREFIX` | error | префикс ID не соответствует типу |
| `NAME-DUP` | error | одинаковый title/alias у разных сущностей (дубликат/неоднозначные ссылки) |
| `REF-MISSING` | error | ID в `related`/`relations`/… не существует |
| `REF-SELF` | warning | связь на себя |
| `REF-TYPE` | warning | неожиданный тип цели (`place` не локация и т. п.) |
| `REF-UNPUBLISHED` | warning | опубликованная сущность ссылается на неопубликованную |
| `REL-TYPE` | warning | тип связи не в `RELATION_TYPES` |
| `LINK-WIKI` | error | битая вики-ссылка |
| `LINK-AMBIG` | error | неоднозначная вики-ссылка |
| `LINK-HEADING` | warning | нет заголовка-якоря |
| `LINK-FILE` | error | markdown-ссылка на отсутствующий файл |
| `DATE-FORMAT` | error | неверный формат григорианской даты |
| `DATE-ORDER` | error | начало позже конца; нарушение `after` |
| `DATE-CYCLE` | error | цикл в `after` |
| `STATUS-DEPRECATED` | warning | `deprecated` без `superseded_by` или наоборот |
| `STATUS-CANON-SOURCES` | warning | `canon` без непустых «Источников» |
| `FOLDER-TYPE` | warning | тип не соответствует папке |
| `FILE-TITLE` | warning | имя файла ≠ title |
| `SECTION-MISSING` | warning | нет разделов «Противоречия и неизвестные сведения» / «Источники» |
| `META-SUMMARY` | warning | нет `summary` |
| `REGISTRY-STALE` | warning | реестр сущностей устарел (CLI) |

Вики-ссылки разрешаются по имени файла, `title`, `aliases` и `id` без учёта регистра и Unicode-формы (NFC) — как в Obsidian. Ссылки внутри кода игнорируются.

## Отчёт о противоречиях

`lore report` → `build/lore/contradictions.md` + `report.json`. Содержит:

1. пункты из разделов «Противоречия и неизвестные сведения» всех статей;
2. эвристики: канон ссылается на не-канон / на устаревшее; односторонние `related`; события без даты или порядка; технологии без научной оценки; изолированные сущности; покрытие каноном;
3. диагностику валидатора.

Это подсказки; отчёт не меняет файлы и не доказывает противоречие.

## Выходные файлы CLI

| Команда | Результат |
|---|---|
| `validate [--json] [--strict]` | диагностика в консоль; код возврата 1 при ошибках |
| `check-links` | только `LINK-*`, `REF-*` |
| `index` | `build/lore/index.json`, `timeline.json`; обновляет `universe/00-meta/Реестр сущностей.md` |
| `graph` | `build/lore/graph.json` (`nodes`, `edges` с типом и подписью) |
| `report` | `build/lore/contradictions.md`, `report.json` |
| `build` | `index` → `validate` → `graph` → `report` |

## Энциклопедия

`src/lib/lore.ts` загружает базу через `@archon/lore-parser` и во время сборки генерирует страницы: `/`, `/[section]`, `/entity/[id]`, `/universe`, `/universe/[note]`, `/timeline`, `/connections`, `/search`. Публикуются статусы кроме `draft`/`archived`. Ссылки на неопубликованное отображаются обычным текстом.

## Как расширять

- **Тип сущности** — `ENTITY_TYPES`, `TYPE_INFO` (префикс, папки, раздел сайта), шаблон в `templates/`, тест.
- **Тип связи** — запись в `RELATION_TYPES`.
- **Поле frontmatter** — `entityFrontmatterSchema`, документация выше, тест.
- **Проверка** — функция в `validate.ts` + код в таблице выше + тест в `tests/validator.test.ts`.
