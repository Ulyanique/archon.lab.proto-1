export const BOOK_ASSEMBLY_KEY = "archon-book-assembly-v1";
export type BookPiece = { id: string; title: string; kind: string; html: string; includedByDefault: boolean };
export type BookArrangement = { order: string[]; included: string[] };

export function defaultArrangement(pieces: Pick<BookPiece, "id" | "includedByDefault">[]): BookArrangement {
  return { order: pieces.map((p) => p.id), included: pieces.filter((p) => p.includedByDefault).map((p) => p.id) };
}
/** Новые фрагменты добавляются в конец по умолчанию; неизвестные ID не отбрасываются молча. */
export function parseArrangement(raw: string | null, pieces: Pick<BookPiece, "id" | "includedByDefault">[]): BookArrangement {
  if (raw === null) return defaultArrangement(pieces);
  const input: unknown = JSON.parse(raw);
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Некорректная сборка");
  const data = input as Record<string, unknown>;
  if (data.version !== 1 || !Array.isArray(data.order) || !Array.isArray(data.included) || !data.order.every((id) => typeof id === "string") || !data.included.every((id) => typeof id === "string")) throw new Error("Неподдерживаемый формат сборки");
  const known = new Set(pieces.map((piece) => piece.id));
  const order = data.order as string[], included = data.included as string[];
  if (new Set(order).size !== order.length || new Set(included).size !== included.length || order.some((id) => !known.has(id)) || included.some((id) => !order.includes(id))) throw new Error("Сборка содержит неизвестные или повторные фрагменты");
  const newPieces = pieces.filter((piece) => !order.includes(piece.id));
  return { order: [...order, ...newPieces.map((piece) => piece.id)], included: [...included, ...newPieces.filter((piece) => piece.includedByDefault).map((piece) => piece.id)] };
}
export function serializeArrangement(value: BookArrangement): string { return JSON.stringify({ version: 1, ...value }); }
export function movePiece(value: BookArrangement, id: string, target: "up" | "down" | "first"): BookArrangement {
  const index = value.order.indexOf(id);
  if (index < 0) return value;
  const next = target === "first" ? 0 : target === "up" ? index - 1 : index + 1;
  if (next < 0 || next >= value.order.length || index === next) return value;
  const order = [...value.order]; order.splice(index, 1); order.splice(next, 0, id);
  return { ...value, order };
}
