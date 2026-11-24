import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findRepoRoot, loadKnowledgeBase } from "@archon/lore-parser";
import { isPublishedStatus } from "@archon/lore-schema";
import { validateMediaCatalog } from "../src/lib/media-validation";

const art = { id: "art-001", title: "Арт", description: "Исследование", image: "/images/art.webp", alt: "Арт", category: "Персонаж", author: "Автор", rights: "Условия", prompt: "Промпт", related: ["character-test"] };
const model = { id: "model-001", title: "Модель", description: "Исследование", file: "/media/model.glb", author: "Автор", rights: "Условия", related: ["character-test"] };
const ids = new Set(["character-test"]);
function fixture(run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), "archon-media-"));
  try { mkdirSync(join(root, "public/images"), { recursive: true }); mkdirSync(join(root, "public/media"), { recursive: true }); run(root); }
  finally { rmSync(root, { recursive: true, force: true }); }
}
describe("целостность медиаархива", () => {
  it("проверяет существование и опубликованные связи реального каталога", () => {
    const root = findRepoRoot(), kb = loadKnowledgeBase(root);
    expect(validateMediaCatalog(root, new Set(kb.entities.filter((e) => isPublishedStatus(e.fm.status)).map((e) => e.id)))).toEqual([]);
  });
  it("принимает файлы и ссылки и допускает атмосферную работу без связанной сущности", () => fixture((root) => {
    writeFileSync(join(root, "public/images/art.webp"), "fixture"); writeFileSync(join(root, "public/media/model.glb"), "fixture");
    expect(validateMediaCatalog(root, ids, { art: [{ ...art, related: [] }], models: [model] })).toEqual([]);
  }));
  it("сообщает об отсутствующих файлах, непубличных и повторённых ID", () => fixture((root) => {
    const diagnostics = validateMediaCatalog(root, ids, { art: [{ ...art, related: ["archived-test", "archived-test"] }], models: [model] });
    expect(diagnostics.filter((d) => d.code === "MEDIA-FILE")).toHaveLength(2);
    expect(diagnostics.filter((d) => d.code === "MEDIA-REF")).toHaveLength(2);
    expect(diagnostics.filter((d) => d.code === "MEDIA-REF-DUP")).toHaveLength(1);
  }));
  it("отклоняет LFS-указатель и символическую ссылку за пределы public", () => fixture((root) => {
    writeFileSync(join(root, "public/images/art.webp"), "version https://git-lfs.github.com/spec/v1\noid sha256:abc\n");
    writeFileSync(join(root, "outside.glb"), "outside"); symlinkSync(join(root, "outside.glb"), join(root, "public/media/model.glb"));
    const errors = validateMediaCatalog(root, ids, { art: [art], models: [model] });
    expect(errors).toHaveLength(2);
    expect(errors[0].message).toContain("указатель Git LFS");
    expect(errors[1].message).toContain("внутри public");
  }));
  it("сообщает о некорректных схемах, пустых правах и повторных ID", () => fixture((root) => {
    const errors = validateMediaCatalog(root, ids, { art: [art, art], models: [{ ...model, rights: "   " }] });
    expect(errors.map((d) => d.code)).toEqual(["MEDIA-SCHEMA", "MEDIA-SCHEMA"]);
  }));
});
