import { describe, expect, it } from "vitest";
import { renderDocument, slugify } from "../src/lib/markdown";
import { validateKnowledgeBase } from "@archon/lore-validator";
import { entity, kbFrom } from "./helpers";

const kb = kbFrom({
  "universe/01-cosmology/Альфа.md": entity({
    id: "concept-alpha",
    title: "Альфа",
    body: "См. [[Бета]], [[Бета|псевдоним]], [[Черновик]], [[Нет такой]] и [md](Бета.md).\n\n`[[Код]]`\n\n![[картинка.png]]\n\n[каталог](../)",
  }),
  "universe/01-cosmology/Бета.md": entity({ id: "concept-beta", title: "Бета" }),
  "universe/01-cosmology/Черновик.md": entity({ id: "concept-draft", title: "Черновик", status: "draft" }),
  "universe/00-meta/Мета заметка.md": "# Мета\n\nТекст [[Альфа]]",
});

describe("сайт: рендер Markdown", () => {
  const alpha = kb.documents.find((d) => d.fileName === "Альфа")!;
  const html = renderDocument(kb, alpha);

  it("превращает вики-ссылки и md-ссылки на опубликованные сущности в ссылки сайта", () => {
    expect(html).toContain('<a href="/entity/concept-beta">Бета</a>');
    expect(html).toContain('<a href="/entity/concept-beta">псевдоним</a>');
    expect((html.match(/href="\/entity\/concept-beta"/g) ?? []).length).toBe(3);
  });

  it("не публикует ссылки на черновики и несуществующее — выводит обычным текстом", () => {
    expect(html).not.toContain("concept-draft");
    expect(html).toContain('<span class="unlinked"');
    expect(html).toContain("Черновик");
    expect(html).toContain("Нет такой");
  });

  it("не трогает код и убирает вложения без медиа", () => {
    expect(html).toContain("<code>[[Код]]</code>");
    expect(html).not.toContain("картинка");
  });

  it("убирает первый H1 из тела (заголовок выводит страница)", () => {
    expect(html).not.toContain("<h1");
  });

  it("slugify транслитерирует кириллицу детерминированно", () => {
    expect(slugify("Открытые вопросы")).toBe("otkrytye-voprosy");
    expect(slugify("Scrypt (Crypt of Mind)")).toBe("scrypt-crypt-of-mind");
  });

  it("ссылки на каталоги и вложения валидны для валидатора, неверные — нет", () => {
    const diags = validateKnowledgeBase(kb).filter((d) => d.severity === "error");
    const messages = diags.map((d) => d.message).join("\n");
    expect(messages).toContain("[[Нет такой]]");
    expect(messages).toContain("[[картинка.png]]");
    expect(messages).not.toContain("каталог");
  });
});
