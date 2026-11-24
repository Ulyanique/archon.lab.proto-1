import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import models from "../../assets/media/models.json";

const modelSchema = z.object({
  id: z.string().regex(/^model-\d+$/),
  title: z.string().min(1).refine((value) => value.trim().length > 0, "Не может состоять только из пробелов"),
  description: z.string().min(1).refine((value) => value.trim().length > 0, "Не может состоять только из пробелов"),
  file: z.string().regex(/^\/media\/[a-z0-9][a-z0-9._-]*\.glb$/),
  author: z.string().min(1).refine((value) => value.trim().length > 0, "Не может состоять только из пробелов"),
  rights: z.string().min(1).refine((value) => value.trim().length > 0, "Не может состоять только из пробелов"),
  related: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)).min(1),
});

/** GLB — локальный самостоятельный файл; просмотрщик не подгружается автоматически. */
export function parseModels(data: unknown) {
  const parsed = z.array(modelSchema).parse(data);
  if (new Set(parsed.map((model) => model.id)).size !== parsed.length) throw new Error("Повторный ID 3D-модели");
  return parsed;
}
export function modelsForEntity(id: string, data: unknown = models, root = process.cwd()) {
  const found = parseModels(data).filter((model) => model.related.includes(id));
  for (const model of found) if (!existsSync(join(root, "public", model.file))) throw new Error(`Не найден файл 3D-модели: ${model.file}`);
  return found;
}
