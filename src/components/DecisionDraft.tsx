"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CHOICE_LABELS, DECISIONS_KEY, conflictWarnings, dependencyWarnings, formatDecisionDrafts, parseDecisionDrafts, serializeDecisionDrafts, type DecisionDrafts, type DecisionNode, type DraftChoice } from "@/lib/decision-drafts";

const EVENT = "archon-decision-drafts-change";
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(EVENT, callback); };
};
const getSnapshot = () => { try { return window.localStorage.getItem(DECISIONS_KEY); } catch { return "__storage_unavailable__"; } };
const getServerSnapshot = () => null;

function useDrafts() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  try { return { drafts: parseDecisionDrafts(raw), error: false }; }
  catch { return { drafts: {} as DecisionDrafts, error: true }; }
}

type Draft = { choice: DraftChoice; note: string };
const draftKey = (draft?: Draft) => draft ? JSON.stringify(draft) : "";

function saveDraft(id: string, value: Draft | null, expected: string) {
  const current = parseDecisionDrafts(window.localStorage.getItem(DECISIONS_KEY));
  if (draftKey(current[id]) !== expected) throw new Error("conflict");
  if (value) current[id] = value;
  else delete current[id];
  window.localStorage.setItem(DECISIONS_KEY, serializeDecisionDrafts(current));
  window.dispatchEvent(new Event(EVENT));
}

export function DecisionEditor({ item, nodes }: { item: DecisionNode; nodes: DecisionNode[] }) {
  const { drafts, error } = useDrafts();
  const [message, setMessage] = useState("");
  const saved = drafts[item.id];
  return <DecisionEditorForm key={item.id} item={item} nodes={nodes} saved={saved} drafts={drafts} storageError={error} message={message} setMessage={setMessage} />;
}

function DecisionEditorForm({ item, nodes, saved, drafts, storageError, message, setMessage }: { item: DecisionNode; nodes: DecisionNode[]; saved?: { choice: DraftChoice; note: string }; drafts: DecisionDrafts; storageError: boolean; message: string; setMessage: (value: string) => void }) {
  const savedKey = draftKey(saved);
  const [form, setForm] = useState(() => ({ choice: saved?.choice ?? "" as DraftChoice | "", note: saved?.note ?? "", baseline: savedKey, observed: savedKey }));
  // Не терять ввод, если другая вкладка изменила ту же запись.
  if (form.observed !== savedKey) {
    const dirty = draftKey(form.choice ? { choice: form.choice, note: form.note } : undefined) !== form.baseline || (!form.choice && form.note !== "");
    setForm(dirty ? { ...form, observed: savedKey } : { choice: saved?.choice ?? "", note: saved?.note ?? "", baseline: savedKey, observed: savedKey });
  }
  const { choice, note, baseline } = form;
  const conflict = baseline !== savedKey;
  const dirty = draftKey(choice ? { choice, note } : undefined) !== baseline || (!choice && note !== "");
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const onLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download") || (link.target && link.target.toLowerCase() !== "_self")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
      if (!window.confirm("Есть несохранённые изменения. Уйти со страницы и потерять их?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onLinkClick, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", onLinkClick, true); };
  }, [dirty]);
  const update = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));
  const persist = (value: Draft | null, overwrite = false) => {
    try {
      saveDraft(item.id, value, overwrite ? savedKey : baseline);
      const nextKey = draftKey(value ?? undefined);
      setForm({ choice: value?.choice ?? "", note: value?.note ?? "", baseline: nextKey, observed: nextKey });
      setMessage(value ? "Черновик сохранён в этом браузере." : "Черновик удалён из этого браузера.");
    } catch (error) {
      setMessage(error instanceof Error && error.message === "conflict" ? "Черновик изменился в другой вкладке. Проверьте конфликт перед сохранением." : "Не удалось сохранить: проверьте доступ к хранилищу браузера.");
    }
  };
  const warnings = [...dependencyWarnings(drafts, nodes).filter((warning) => warning.startsWith(`${item.id}:`)), ...conflictWarnings(drafts, nodes).filter((warning) => warning.ids.includes(item.id)).map((warning) => warning.message)];
  return <section className="decision-editor" aria-labelledby="decision-title">
    <p className="section-kicker">МАСТЕРСКАЯ / ЛИЧНЫЙ ЧЕРНОВИК</p><h2 id="decision-title">Ваш ответ</h2>
    <p>Сохраните черновик в этом браузере, затем скопируйте его со страницы гипотез и отправьте в обсуждение. Он не меняет реестр, не синхронизируется между устройствами и может исчезнуть при очистке данных браузера.</p>
    {storageError ? <p className="decision-error" role="alert">Не удалось прочитать локальный черновик. Данные не будут перезаписаны; проверьте доступ к хранилищу браузера.</p> : null}
    <fieldset disabled={storageError}><legend>Оценка {item.id}</legend><div className="decision-choices">{(Object.entries(CHOICE_LABELS) as [DraftChoice, string][]).map(([value, label]) => <label key={value}><input type="radio" name={`decision-${item.id}`} value={value} checked={choice === value} onChange={() => { update({ choice: value }); setMessage(""); }} /><span>{label}</span></label>)}</div>
      <label className="decision-note-label" htmlFor={`decision-note-${item.id}`}>ОГОВОРКИ ИЛИ ЧТО ДОРАБОТАТЬ <span>необязательно</span></label><textarea id={`decision-note-${item.id}`} maxLength={2000} rows={3} value={note} onChange={(event) => { update({ note: event.target.value }); setMessage(""); }} placeholder="Например, нравится только при условии…" />
      {dirty && <p className="decision-unsaved">Есть несохранённые изменения. Сохраните ответ перед уходом со страницы.</p>}
      {conflict && <div className="decision-error" role="alert"><p>Сохранённый черновик изменился в другой вкладке. Ваш ввод сохранён в форме, но ещё не записан.</p><div className="decision-actions"><button type="button" className="decision-secondary" onClick={() => { setForm({ choice: saved?.choice ?? "", note: saved?.note ?? "", baseline: savedKey, observed: savedKey }); setMessage("Загружена версия из хранилища."); }}>ЗАГРУЗИТЬ ДРУГУЮ ВЕРСИЮ</button><button type="button" disabled={!choice} onClick={() => { if (choice) persist({ choice, note }, true); }}>ПЕРЕЗАПИСАТЬ СВОИМ ВАРИАНТОМ</button></div></div>}
      <div className="decision-actions"><button type="button" disabled={!choice || conflict} onClick={() => { if (choice) persist({ choice, note }); }}>СОХРАНИТЬ ЧЕРНОВИК</button>{saved ? <button type="button" className="decision-secondary" disabled={conflict} onClick={() => persist(null)}>УДАЛИТЬ ЧЕРНОВИК</button> : null}</div>
    </fieldset>
    {message ? <p className="decision-message" role="status">{message}</p> : null}
    {saved ? <p className="decision-saved">В ЭТОМ БРАУЗЕРЕ: {CHOICE_LABELS[saved.choice]} · СТАТУС РЕЕСТРА: {item.status}</p> : null}
    {warnings.length > 0 && <ul className="decision-warnings">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
    <Link className="decision-overview-link" href="/hypotheses#decision-drafts">ОТКРЫТЬ СПИСОК ЧЕРНОВИКОВ ↗</Link>
  </section>;
}

export function DecisionOverview({ nodes }: { nodes: DecisionNode[] }) {
  const { drafts, error } = useDrafts();
  const [copyStatus, setCopyStatus] = useState("");
  const entries = Object.entries(drafts).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }));
  const text = formatDecisionDrafts(drafts);
  const warnings = [...dependencyWarnings(drafts, nodes), ...conflictWarnings(drafts, nodes).map((warning) => warning.message)];
  const known = new Map(nodes.map((node) => [node.id, node]));
  return <section className="decision-overview" id="decision-drafts" aria-labelledby="decision-overview-title">
    <div><p className="section-kicker">ОБСУЖДЕНИЕ / ЛИЧНЫЕ ЗАМЕТКИ</p><h2 id="decision-overview-title">Черновики ответов <span>{String(entries.length).padStart(2, "0")}</span></h2><p>Отметьте идеи на их страницах. Черновики хранятся только в этом браузере и не меняют реестр; чтобы передать решение, скопируйте текст и отправьте его в обсуждение.</p></div>
    {error ? <p className="decision-error" role="alert">Не удалось прочитать локальные данные. Проверьте доступ к хранилищу браузера; данные не перезаписаны.</p> : entries.length === 0 ? <p className="decision-overview-empty">ПОКА НЕТ СОХРАНЁННЫХ ОТВЕТОВ</p> : <div className="decision-overview-content"><ul>{entries.map(([id, draft]) => <li key={id}><span>{known.has(id) ? <Link href={`/hypotheses/${id}`}>{id} ↗</Link> : `${id} — отсутствует в реестре`}</span><b>{CHOICE_LABELS[draft.choice]}</b></li>)}</ul>{warnings.length > 0 ? <div><p className="section-kicker">ПРОВЕРЬТЕ ЗАВИСИМОСТИ И СОВМЕСТИМОСТЬ</p><ul className="decision-warnings">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}<label htmlFor="decision-export">ТЕКСТ ДЛЯ ОБСУЖДЕНИЯ</label><textarea id="decision-export" rows={Math.min(Math.max(entries.length + 1, 3), 10)} readOnly value={text} /><div className="decision-actions"><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopyStatus("Скопировано. Отправьте текст в обсуждение."); } catch { setCopyStatus("Не удалось скопировать. Выделите текст выше вручную."); } }}>КОПИРОВАТЬ ОТВЕТЫ</button><span role="status">{copyStatus}</span></div></div>}
    <p className="decision-disclaimer">Положительная оценка не принимает связанные идеи и зависимости автоматически и не утверждает канон.</p>
  </section>;
}
