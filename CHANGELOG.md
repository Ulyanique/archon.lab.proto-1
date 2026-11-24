# CHANGELOG

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/). Изменения **канона** помечаются `[lore]`.

## [Unreleased]

### Added
- Аудит рабочего пространства: `PROJECT_AUDIT.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `CONTENT_MIGRATION.md`, `AGENTS.md`.
- Foundation: git, структура `universe/`, шаблоны, Obsidian Vault, README/CONTRIBUTING/CHANGELOG.
- [lore] Перенесена исходная база лора из ТЗ: 16 сущностей (Архон, Элеон, Алексей Харпер, Элеонора, Лимб, Мурманский бункер, Нейрис, Первый Храм, Луна и распределённая инфраструктура Элеона, Scrypt, Последний Разум, 2 технологии, 3 события) и 7 мета-заметок. Ни одной сущности со статусом `canon`.
- Knowledge Base MVP: `lore-schema`, `lore-parser`, `lore-validator`, `lore-indexer`, CLI `scripts/lore.ts`, Vitest, GitHub Actions.
- Encyclopedia MVP (Next.js): главная, каталоги, страницы сущностей, поиск, связи, хронология.
- ADR 0001–0003.

### Changed
- [lore] По решению владельца нейроинтерфейс архивирован; уточнены внешний VR-доступ к Лимбу, независимость исследований биологических вычислений и роль труднодоступной Луны. Экономическая модель сохранена как черновик.
- Стартовая страница шаблона заменена энциклопедией; `/api/health` не менялся.
