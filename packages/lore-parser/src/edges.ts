import type { KnowledgeBase } from "./kb";

export interface Edge {
  source: string;
  target: string;
  /** Ключ из реестра типов связей (`RELATION_TYPES`) либо пользовательский. */
  type: string;
  origin: "frontmatter" | "body";
  /** Поле frontmatter, из которого получена связь. */
  field?: string;
  note?: string;
}

/**
 * Единственное место, где из YAML и Markdown выводятся связи между сущностями.
 * Граф, проверки и сайт используют именно его — связи вручную нигде не дублируются.
 * Ссылки на несуществующие ID сюда не попадают (их ловит валидатор).
 */
export function extractEdges(kb: KnowledgeBase): Edge[] {
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const pathToEntity = new Map(kb.entities.map((e) => [e.doc.path, e]));

  const push = (edge: Edge) => {
    if (edge.source === edge.target || !kb.byId.has(edge.target)) return;
    const key = `${edge.source}|${edge.target}|${edge.type}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(edge);
  };

  for (const e of kb.entities) {
    const { fm } = e;
    const fromField = (field: string, ids: string[], type: string) => {
      for (const target of ids) push({ source: e.id, target, type, origin: "frontmatter", field });
    };
    fromField("related", fm.related, "related");
    for (const r of fm.relations) {
      push({ source: e.id, target: r.target, type: r.type, origin: "frontmatter", field: "relations", note: r.note });
    }
    fromField("participants", fm.participants, "participant");
    if (fm.place) fromField("place", [fm.place], "located-in");
    fromField("technologies", fm.technologies, "involves-technology");
    fromField("after", fm.after, "after");
    if (fm.superseded_by) fromField("superseded_by", [fm.superseded_by], "superseded-by");

    for (const link of e.doc.links) {
      if (link.embed) continue;
      if (link.kind === "wiki") {
        const res = link.target ? kb.resolveWiki(link.target) : null;
        if (res?.status === "ok" && res.entity) push({ source: e.id, target: res.entity.id, type: "mention", origin: "body" });
      } else {
        const hit = pathToEntity.get(kb.resolveRelative(e.doc.path, link.target));
        if (hit) push({ source: e.id, target: hit.id, type: "mention", origin: "body" });
      }
    }
  }
  return edges;
}
