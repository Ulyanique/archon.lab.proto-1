import { closeSync, existsSync, openSync, readSync, realpathSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { Diagnostic } from "@archon/lore-validator";
import { parseConceptArt } from "./concept-art";
import { parseModels } from "./model-media";
import artCatalog from "../../assets/concept-art/catalog.json";
import modelCatalog from "../../assets/media/models.json";

/** Проверяет только механическую целостность, не устанавливает права или канон. */
export function validateMediaCatalog(root: string, publishedIds: ReadonlySet<string>, data: { art: unknown; models: unknown } = { art: artCatalog, models: modelCatalog }): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const validate = (items: { id: string; file: string; related: string[] }[], catalogPath: string) => {
    for (const item of items) {
      const path = join(root, "public", item.file);
      try {
        const publicRoot = realpathSync(join(root, "public"));
        const actual = realpathSync(path);
        const rel = relative(publicRoot, actual);
        if (rel === ".." || rel.startsWith(`..${sep}`) || !statSync(actual).isFile()) throw new Error("не является обычным файлом внутри public");
        // Git LFS pointer не является изображением или GLB, даже если файл существует.
        const fd = openSync(actual, "r");
        const header = Buffer.alloc(80);
        let length: number;
        try { length = readSync(fd, header, 0, header.length, 0); } finally { closeSync(fd); }
        if (header.subarray(0, length).toString("utf8").startsWith("version https://git-lfs.github.com/spec/v1")) throw new Error("это указатель Git LFS; загрузите настоящий файл через git lfs pull");
      } catch (error) {
        const reason = existsSync(path) && error instanceof Error ? error.message : "файл отсутствует";
        diagnostics.push({ severity: "error", code: "MEDIA-FILE", path: catalogPath, message: `${item.id}: ${item.file} — ${reason}` });
      }
      const seen = new Set<string>();
      for (const id of item.related) {
        if (seen.has(id)) diagnostics.push({ severity: "error", code: "MEDIA-REF-DUP", path: catalogPath, message: `${item.id}: повторная связь с ${id}` });
        seen.add(id);
        if (!publishedIds.has(id)) diagnostics.push({ severity: "error", code: "MEDIA-REF", path: catalogPath, message: `${item.id}: ${id} не найдена среди опубликованных сущностей` });
      }
    }
  };
  try { validate(parseConceptArt(data.art).map((item) => ({ ...item, file: item.image })), "assets/concept-art/catalog.json"); }
  catch (error) { diagnostics.push({ severity: "error", code: "MEDIA-SCHEMA", path: "assets/concept-art/catalog.json", message: error instanceof Error ? error.message : String(error) }); }
  try { validate(parseModels(data.models), "assets/media/models.json"); }
  catch (error) { diagnostics.push({ severity: "error", code: "MEDIA-SCHEMA", path: "assets/media/models.json", message: error instanceof Error ? error.message : String(error) }); }
  return diagnostics;
}
