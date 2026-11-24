import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { modelsForEntity, parseModels } from "../src/lib/model-media";

const model = { id: "model-001", title: "Исследование", description: "Набросок", file: "/media/study.glb", author: "Автор", rights: "Условия", related: ["location-limbo"] };
describe("каталог 3D-моделей", () => {
  it("принимает самодостаточный локальный GLB с метаданными", () => { expect(parseModels([model])).toEqual([model]); });
  it("отклоняет небезопасные пути, пропущенные права и дубликаты", () => {
    expect(() => parseModels([{ ...model, file: "/media/../private.glb" }])).toThrow();
    expect(() => parseModels([{ ...model, file: "https://example.com/model.glb" }])).toThrow();
    expect(() => parseModels([{ ...model, rights: "" }])).toThrow();
    expect(() => parseModels([model, model])).toThrow();
  });
  it("привязывает существующий файл к нужной записи и не скрывает отсутствующий", () => {
    const root = mkdtempSync(join(tmpdir(), "archon-model-test-"));
    try {
      expect(modelsForEntity("character-eleon", [model], root)).toEqual([]);
      expect(() => modelsForEntity("location-limbo", [model], root)).toThrow(/Не найден файл/);
      mkdirSync(join(root, "public", "media"), { recursive: true });
      writeFileSync(join(root, "public", "media", "study.glb"), "test fixture");
      expect(modelsForEntity("location-limbo", [model], root)).toEqual([model]);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("не выдумывает 3D-материалы, пока их не добавили", () => { expect(modelsForEntity("location-limbo")).toEqual([]); });
});
