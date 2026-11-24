import { z } from "zod";
import entries from "../../assets/concept-art/catalog.json";

const art = z.object({
  id: z.string().regex(/^art-\d+$/),
  title: z.string().min(1).refine((value) => value.trim().length > 0, "Не может состоять только из пробелов"),
  description: z.string().min(1).refine((value) => value.trim().length > 0, "Не может состоять только из пробелов"),
  image: z.string().regex(/^\/images\/[a-z0-9][a-z0-9._-]*\.(?:jpg|jpeg|png|webp)$/),
  alt: z.string().min(1).refine((value) => value.trim().length > 0, "Не может состоять только из пробелов"),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  category: z.string().min(1).refine((value) => value.trim().length > 0, "Не может состоять только из пробелов"),
  author: z.string().min(1).refine((value) => value.trim().length > 0, "Не может состоять только из пробелов"),
  rights: z.string().min(1).refine((value) => value.trim().length > 0, "Не может состоять только из пробелов"),
  related: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)),
  prompt: z.string().min(1).refine((value) => value.trim().length > 0, "Не может состоять только из пробелов"),
});

export function parseConceptArt(data: unknown) {
  const result = z.array(art).parse(data);
  if (new Set(result.map((item) => item.id)).size !== result.length) throw new Error("Повторный ID концепт-арта");
  return result;
}

export function getConceptArt() { return parseConceptArt(entries); }

/** Явные указатели на публичных страницах, не установление канонического облика. */
export function artForEntity(id: string) { return getConceptArt().filter((item) => item.related.includes(id)); }
