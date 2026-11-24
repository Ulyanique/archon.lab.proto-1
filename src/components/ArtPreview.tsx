"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type Artwork = {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  width?: number;
  height?: number;
  author: string;
  rights: string;
};

/** Нативный модальный диалог возвращает фокус и закрывается по Escape. */
export function ArtPreview({ item, eager = false }: { item: Artwork; eager?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) closeButton.current?.focus(); }, [open]);
  const titleId = useId();
  return <>
    <button className="art-preview-trigger" type="button" aria-label={`Увеличить изображение: ${item.title}`} onClick={() => { setOpen(true); dialog.current?.showModal(); }}>
      <Image src={item.image} alt={item.alt} width={item.width ?? 1600} height={item.height ?? 900} sizes="(max-width: 800px) 100vw, 60vw" loading={eager ? "eager" : "lazy"} />
      <span aria-hidden="true">УВЕЛИЧИТЬ ↗</span>
    </button>
    <dialog ref={dialog} className="art-preview-dialog" aria-labelledby={titleId} onClose={() => setOpen(false)}>
      {open && <div className="art-preview-content">
        <div className="art-preview-bar"><span>{item.id.toUpperCase()} / ВИЗУАЛЬНОЕ ИССЛЕДОВАНИЕ · НЕ КАНОН</span><button ref={closeButton} type="button" onClick={() => dialog.current?.close()} aria-label="Закрыть просмотр изображения">ЗАКРЫТЬ ×</button></div>
        <div className="art-preview-full"><Image src={item.image} alt={item.alt} width={item.width ?? 1600} height={item.height ?? 900} sizes="100vw" unoptimized /></div>
        <div className="art-preview-details"><div><h2 id={titleId}>{item.title}</h2><p>{item.description}</p><p>{item.author} · {item.rights}</p></div><div className="art-preview-links"><Link href={`/concept-art#${item.id}`} onClick={() => dialog.current?.close()}>ПРОИСХОЖДЕНИЕ И ПРОМПТ ↗</Link><a href={item.image} target="_blank" rel="noreferrer">ОТКРЫТЬ ОРИГИНАЛ ↗</a></div></div>
      </div>}
    </dialog>
  </>;
}
