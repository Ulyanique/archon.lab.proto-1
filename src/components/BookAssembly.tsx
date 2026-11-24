"use client";

import { useState, useSyncExternalStore } from "react";
import { BOOK_ASSEMBLY_KEY, defaultArrangement, movePiece, parseArrangement, serializeArrangement, type BookArrangement, type BookPiece } from "@/lib/book-assembly";

const eventName = "archon-book-assembly-change";
const unavailable = "__book_storage_unavailable__";
function subscribe(callback: () => void) { window.addEventListener("storage", callback); window.addEventListener(eventName, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(eventName, callback); }; }
function snapshot() { try { return window.localStorage.getItem(BOOK_ASSEMBLY_KEY); } catch { return unavailable; } }
function serverSnapshot() { return null; }

export function BookAssembly({ pieces }: { pieces: BookPiece[] }) {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [message, setMessage] = useState("");
  let arrangement: BookArrangement;
  let invalid = false;
  try { if (raw === unavailable) throw new Error("storage"); arrangement = parseArrangement(raw, pieces); }
  catch { invalid = true; arrangement = defaultArrangement(pieces); }
  const byId = new Map(pieces.map((piece) => [piece.id, piece]));
  const active = arrangement.order.filter((id) => arrangement.included.includes(id));
  const persist = (next: BookArrangement | null) => {
    try {
      if (window.localStorage.getItem(BOOK_ASSEMBLY_KEY) !== raw) { window.dispatchEvent(new Event(eventName)); setMessage("Сборка изменилась в другой вкладке. Загружена её версия; повторите действие."); return; }
      if (next) window.localStorage.setItem(BOOK_ASSEMBLY_KEY, serializeArrangement(next)); else window.localStorage.removeItem(BOOK_ASSEMBLY_KEY);
      window.dispatchEvent(new Event(eventName));
      setMessage(next ? "Сборка сохранена в этом браузере." : "Восстановлен исходный порядок.");
    } catch { setMessage("Не удалось сохранить сборку: хранилище браузера недоступно."); }
  };
  return <>
    <section className="book-assembly" aria-labelledby="assembly-title"><div className="book-assembly-heading"><div><p className="section-kicker">МАСТЕРСКАЯ / ПОРЯДОК ТЕКСТА</p><h2 id="assembly-title">Собрать начало</h2></div><span>{active.length} / ВЫБРАНО</span></div>
      <p>Включайте фрагменты и меняйте их порядок. Первый включённый становится началом. Это локальная сборка для чтения, не изменение исходных текстов, хронологии или канона.</p>
      <p>Порядок сохраняется только в этом браузере, не синхронизируется и может исчезнуть при очистке данных. Доступны фрагменты первой главы, дневник и три альтернативных начала. Альтернативы не являются последовательными событиями: если вы включите несколько, проверьте повторы и переходы вручную. Редактора глав и вставки произвольных сцен здесь ещё нет.</p>
      {invalid && <p className="decision-error" role="alert">Не удалось прочитать сохранённую сборку. Она не перезаписана; ниже показан исходный порядок. Для удаления неизвестных данных используйте сброс.</p>}
      <ol className="assembly-list">{arrangement.order.map((id, index) => { const piece = byId.get(id)!; const included = arrangement.included.includes(id); return <li key={id}><div className="assembly-item"><span className="assembly-number">{String(index + 1).padStart(2, "0")}</span><div><b>{piece.title}</b><small>{piece.kind}{id === active[0] ? " · НАЧАЛО" : ""}</small></div><label><input type="checkbox" disabled={invalid} checked={included} onChange={() => persist({ ...arrangement, included: included ? arrangement.included.filter((item) => item !== id) : [...arrangement.included, id] })} /> В книге</label></div><div className="assembly-actions"><button type="button" disabled={invalid || index === 0} aria-label={`Выше: ${piece.title}`} onClick={() => persist(movePiece(arrangement, id, "up"))}>↑ ВЫШЕ</button><button type="button" disabled={invalid || index === arrangement.order.length - 1} aria-label={`Ниже: ${piece.title}`} onClick={() => persist(movePiece(arrangement, id, "down"))}>↓ НИЖЕ</button><button type="button" disabled={invalid || (index === 0 && included)} aria-label={`Сделать началом: ${piece.title}`} onClick={() => { const next = movePiece(arrangement, id, "first"); persist({ ...next, included: next.included.includes(id) ? next.included : [...next.included, id] }); }}>В НАЧАЛО</button></div></li>; })}</ol>
      <div className="assembly-bottom"><button type="button" onClick={() => { if (window.confirm("Сбросить локальный порядок и выбор фрагментов? Исходные тексты не изменятся.")) persist(null); }}>ВОССТАНОВИТЬ ИСХОДНУЮ СБОРКУ</button><span role="status" aria-live="polite">{message}</span></div>
    </section>
    <article id="chapter-01" className="book-chapter"><div className="book-chapter-meta"><span>СБОРКА / ПРОЗА</span><span>ПЕРВЫЙ ЧЕРНОВИК</span></div><h2>Две минуты</h2>{active.length ? active.map((id) => { const piece = byId.get(id)!; return <section className="assembled-piece" key={id} id={id} aria-label={piece.title}><p className="assembled-piece-label">{piece.kind} / {piece.title}</p><div className="book-prose prose" dangerouslySetInnerHTML={{ __html: piece.html }} /></section>; }) : <p>В сборке нет фрагментов. Отметьте хотя бы один выше.</p>}</article>
  </>;
}
