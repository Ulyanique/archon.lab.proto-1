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

describe("граница публикации и безопасность", () => {
  it("не публикует полный реестр или ссылки на него", async () => {
    const { metaNotes } = await import("../src/lib/lore");
    const { hrefForDoc } = await import("../src/lib/markdown");
    const { REGISTRY_PATH } = await import("@archon/lore-indexer");
    const privateKb = kbFrom({
      [REGISTRY_PATH]: "# Реестр\n\nСекретный черновик concept-secret",
      "universe/00-meta/Открытая.md": "# Открытая\n\n[[Реестр сущностей]]",
      "universe/01-cosmology/Секретный черновик.md": entity({ id: "concept-secret", title: "Секретный черновик", status: "draft" }),
    });
    const registry = privateKb.documents.find((d) => d.path === REGISTRY_PATH)!;
    const open = privateKb.documents.find((d) => d.fileName === "Открытая")!;
    expect(metaNotes(privateKb).map((n) => n.doc.path)).not.toContain(REGISTRY_PATH);
    expect(hrefForDoc(privateKb, registry)).toBeNull();
    expect(renderDocument(privateKb, open)).not.toContain('href="/universe/reestr-suschnostey"');
  });

  it("удаляет скрипты, обработчики и опасные URL, сохраняя обычные ссылки", () => {
    const unsafeKb = kbFrom({
      "universe/00-meta/Тест.md": '# Тест\n\n<script>alert(1)</script><img src=x onerror="alert(2)">\n\n<a href="javascript:alert(3)" onclick="alert(4)">опасно</a> [безопасно](https://example.org)',
    });
    const html = renderDocument(unsafeKb, unsafeKb.documents[0]);
    expect(html).not.toMatch(/<script|<img|onerror|onclick|javascript:/i);
    expect(html).toContain('<a href="https://example.org">безопасно</a>');
  });
});

describe("якоря и адреса", () => {
  it("создаёт якоря заголовков и сохраняет переходы к ним", () => {
    const anchors = kbFrom({
      "universe/01-cosmology/А.md": entity({ id: "concept-a", title: "А", body: "[[Б#История|вики]] [markdown](Б.md#История) [[#Своя история|свой]] [локально](#Своя%20история)\n\n## Своя история\n\n## Своя история" }),
      "universe/01-cosmology/Б.md": entity({ id: "concept-b", title: "Б", body: "## История\n\nТекст" }),
    });
    const a = renderDocument(anchors, anchors.documents[0]);
    const b = renderDocument(anchors, anchors.documents[1]);
    const history = encodeURIComponent("section-история");
    const own = encodeURIComponent("section-своя-история");
    expect(a).toContain(`/entity/concept-b#${history}`);
    expect(a).toContain(`href="#${own}"`);
    expect(a).toContain('id="section-своя-история"');
    expect(a).toContain('id="section-своя-история-1"');
    expect(b).toContain('id="section-история"');
    const topKb = kbFrom({ "universe/00-meta/Начало.md": "# Начало\n\n[[#Начало|наверх]]" });
    expect(renderDocument(topKb, topKb.documents[0])).toContain('href="#"');
  });

  it("отклоняет пустые и совпадающие адреса мета-заметок", async () => {
    const { metaNotes } = await import("../src/lib/lore");
    const colliding = kbFrom({ "universe/00-meta/Ёж.md": "# Ёж", "universe/00-meta/Еж.md": "# Еж" });
    expect(() => metaNotes(colliding)).toThrow(/Одинаковый URL.*Ёж|Одинаковый URL.*Еж/);
    expect(() => metaNotes(kbFrom({ "universe/00-meta/!!!.md": "# Заметка" }))).toThrow(/Пустой URL/);
  });
});
