"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ text, label = "Copy", copiedLabel = "Copied!", className = "" }) {
  const [status, setStatus] = useState("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text || "");
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch (_error) {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2000);
    }
  }

  const copied = status === "copied";
  const error = status === "error";

  return (
    <button
      className={`copy-button${copied ? " copied" : ""}${error ? " error" : ""}${
        className ? ` ${className}` : ""
      }`}
      onClick={handleCopy}
      type="button"
    >
      {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
      {error ? "Copy failed" : copied ? copiedLabel : label}
    </button>
  );
}
