import { buildKnowledgeBase } from "@archon/lore-parser";

export interface EntityOpts {
  id: string;
  title?: string;
  type?: string;
  status?: string;
  extra?: string;
  body?: string;
}

/** Собирает текст сущности с валидным frontmatter; `extra` — дополнительные YAML-строки. */
export function entity(o: EntityOpts): string {
  return `---
id: ${o.id}
title: ${o.title ?? o.id}
type: ${o.type ?? "concept"}
status: ${o.status ?? "review"}
summary: тест
created: 2026-01-01
updated: 2026-01-01
${o.extra ?? ""}
---

# ${o.title ?? o.id}

${o.body ?? ""}

## Противоречия и неизвестные сведения

- —

## Источники

- тест
`;
}

/** База знаний из набора файлов вида { "universe/01-cosmology/Имя.md": "текст" }. */
export function kbFrom(files: Record<string, string>) {
  return buildKnowledgeBase(
    "/virtual",
    Object.entries(files).map(([path, content]) => ({ path, content })),
  );
}

export const concept = (id: string, name: string, extra = "", body = "") =>
  [`universe/01-cosmology/${name}.md`, entity({ id, title: name, type: "concept", extra, body })] as const;
