# CONTRIBUTING

Работает для людей и AI-агентов. Сначала прочитайте [`AGENTS.md`](AGENTS.md).

## Ветки и коммиты

- `main` — защищённая ветка; в ней канон. Прямые коммиты в `universe/` запрещены, только через PR.
- Ветки: `lore/<тема>` (контент), `feat/<тема>`, `fix/<тема>`, `docs/<тема>`.
- Коммиты — [Conventional Commits](https://www.conventionalcommits.org/): `lore: …`, `feat: …`, `fix: …`, `docs: …`, `chore: …`.
- Один PR — одна тема. Изменения канона и изменения кода — разными PR.

## Pull Request

В PR обязательно:

1. Что изменено и **откуда взяты сведения** (источник).
2. Результат `npx tsx scripts/lore.ts validate` и `report` (новые противоречия).
3. Для `universe/`: перечень затронутых ID и статусов. Повышение статуса до `canon` — только по явному согласию владельца.
4. Для кода: `npx tsc --noEmit`, `npx vitest run`, `npm run build`.
5. Запись в `CHANGELOG.md` (раздел *Unreleased*).

Workflow-файлы сохранены в `.github/workflows-updates/` и сейчас **не запускаются** GitHub Actions. До восстановления CI запускайте вручную `npm ci`, `npm run lint`, `npx next typegen`, `npm run typecheck`, `npx vitest run`, `npx tsx scripts/lore.ts validate --strict` и `npm run build`. Если сборке необходим `DATABASE_URL`, задайте его в окружении.

## Ревью

Контент: проверка Continuity Auditor (агент или человек) + владелец. Научно значимое — Science Research Agent. Агент не одобряет и не сливает собственный спорный PR.

## Артефакты

- Не коммитьте `build/`, `.next/`, `node_modules/`, `.env`.
- Тяжёлые бинарные файлы — только через Git LFS (`assets/README.md`). Неизвестные права на медиа → не коммитить.
