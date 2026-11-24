/** Типизированные утверждения из реестра: упоминание может содержать отрицание. */
export interface HypothesisGraphNode {
  id: string;
  title: string;
  status: string;
  references: string[];
  dependencies: string[];
  conflicts?: string[];
}
export interface HypothesisGraphEdge { source: string; target: string; kind: "dependency" | "mention" | "conflict" }

export function buildHypothesisGraph(nodes: HypothesisGraphNode[]): { edges: HypothesisGraphEdge[]; unresolved: { source: string; target: string }[] } {
  const known = new Set(nodes.map((node) => node.id));
  const edges: HypothesisGraphEdge[] = [];
  const unresolved: { source: string; target: string }[] = [];
  const conflictPairs = new Set<string>();
  for (const node of nodes) for (const target of node.conflicts ?? []) {
    if (!known.has(target)) { unresolved.push({ source: node.id, target }); continue; }
    const [source, other] = [node.id, target].sort();
    const key = `${source}:${other}`;
    if (!conflictPairs.has(key)) { conflictPairs.add(key); edges.push({ source, target: other, kind: "conflict" }); }
  }
  for (const node of nodes) {
    for (const target of new Set([...node.dependencies, ...node.references])) {
      if (!known.has(target)) { if (!unresolved.some((edge) => edge.source === node.id && edge.target === target)) unresolved.push({ source: node.id, target }); continue; }
      const pair = [node.id, target].sort().join(":");
      if (node.dependencies.includes(target)) edges.push({ source: node.id, target, kind: "dependency" });
      else if (!conflictPairs.has(pair)) edges.push({ source: node.id, target, kind: "mention" });
    }
  }
  return { edges, unresolved };
}
