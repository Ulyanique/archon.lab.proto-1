import { Parser } from "htmlparser2";

// На входе HTML из renderDocument: он уже прошёл санитаризацию и правила публикации ссылок.
// Текст берётся из DOM-содержимого, не из href, src или необработанного Markdown.
export function visibleTextFromHtml(html: string): string {
  const blocks = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "br", "div", "blockquote", "pre", "tr", "td", "th", "hr"]);
  let result = "";
  const parser = new Parser({
    onopentag(name) { if (blocks.has(name)) result += " "; },
    ontext(text) { result += text; },
    onclosetag(name) { if (blocks.has(name)) result += " "; },
  }, { decodeEntities: true });
  parser.end(html);
  return result.replace(/\s+/g, " ").trim();
}
