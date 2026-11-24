"use client";

import { useState } from "react";

export function CopyPrompt({ prompt }: { prompt: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage("Промпт скопирован");
    } catch {
      setMessage("Не удалось скопировать — выделите текст вручную");
    }
  }
  return <div className="copy-prompt"><button type="button" onClick={copy}>КОПИРОВАТЬ ПРОМПТ ↗</button><span role="status">{message}</span></div>;
}
