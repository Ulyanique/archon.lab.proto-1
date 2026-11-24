/** Личные черновики не являются решениями владельца в реестре и не меняют лор. */
export const DECISIONS_KEY = "archon.hypothesis-decision-drafts.v1";
export type DraftChoice = "liked" | "disliked" | "revise";
export type DecisionDrafts = Record<string, { choice: DraftChoice; note: string }>;
export interface DecisionNode { id: string; title: string; status: string; dependencies: string[]; conflicts?: string[] }
export const CHOICE_LABELS: Record<DraftChoice, string> = { liked: "нравится", disliked: "не нравится", revise: "доработать" };

/** Не затираем повреждённые данные или данные будущего формата молча. */
export function parseDecisionDrafts(raw: string | null): DecisionDrafts {
  if (raw === null) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || (parsed as { version?: unknown }).version !== 1) throw new Error("Неизвестный формат черновика");
  const decisions = (parsed as { decisions?: unknown }).decisions;
  if (!decisions || typeof decisions !== "object" || Array.isArray(decisions)) throw new Error("Неверный список черновиков");
  const result: DecisionDrafts = {};
  for (const [id, value] of Object.entries(decisions)) {
    if (!/^H-\d{3,}$/.test(id) || !value || typeof value !== "object" || Array.isArray(value)) throw new Error("Неверная запись черновика");
    const { choice, note } = value as { choice?: unknown; note?: unknown };
    if ((choice !== "liked" && choice !== "disliked" && choice !== "revise") || typeof note !== "string" || note.length > 2000) throw new Error("Неверный ответ в черновике");
    result[id] = { choice, note };
  }
  return result;
}

export function serializeDecisionDrafts(drafts: DecisionDrafts): string {
  return JSON.stringify({ version: 1, decisions: drafts });
}

export function formatDecisionDrafts(drafts: DecisionDrafts): string {
  return Object.entries(drafts).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([id, draft]) => {
    const note = draft.note.trim().replace(/\s*\n\s*/g, " / ");
    return `${id} ${CHOICE_LABELS[draft.choice]}${note ? `: ${note}` : ""}`;
  }).join("\n");
}

export function dependencyWarnings(drafts: DecisionDrafts, nodes: DecisionNode[]): string[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const warnings: string[] = [];
  for (const node of nodes) {
    if (drafts[node.id]?.choice !== "liked") continue;
    for (const id of node.dependencies) {
      const dependency = byId.get(id);
      const draft = drafts[id];
      if (!dependency) warnings.push(`${node.id}: обязательная зависимость ${id} отсутствует в реестре.`);
      else {
        if (dependency.status.toLocaleLowerCase("ru").startsWith("не нравится владельцу")) warnings.push(`${node.id}: обязательная зависимость ${id} отклонена в реестре; нужно пересмотреть формулировку.`);
        if (draft?.choice === "disliked") warnings.push(`${node.id}: обязательная зависимость ${id} отмечена «не нравится» в черновике; нужно пересмотреть формулировку.`);
        else if (draft?.choice === "revise") warnings.push(`${node.id}: обязательная зависимость ${id} отмечена «доработать» в черновике.`);
        else if (!draft) warnings.push(`${node.id}: обязательная зависимость ${id} ещё не оценена в черновике; она не принимается автоматически.`);
      }
    }
  }
  return warnings;
}

/** Только явно описанные пары; оценка остаётся личным черновиком, а границы конфликта — в тексте гипотез. */
export function conflictWarnings(drafts: DecisionDrafts, nodes: DecisionNode[]): { ids: [string, string]; message: string }[] {
  const known = new Set(nodes.map((node) => node.id));
  const seen = new Set<string>();
  const warnings: { ids: [string, string]; message: string }[] = [];
  for (const node of nodes) {
    if (drafts[node.id]?.choice !== "liked") continue;
    for (const other of node.conflicts ?? []) {
      if (!known.has(other) || drafts[other]?.choice !== "liked") continue;
      const ids = [node.id, other].sort() as [string, string];
      const key = ids.join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      warnings.push({ ids, message: `${ids[0]} и ${ids[1]} отмечены «нравится», но описаны как несовместимые в определённых условиях. Проверьте формулировки и оговорки.` });
    }
  }
  return warnings;
}
