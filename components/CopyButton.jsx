"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  className = "",
  iconOnly = false,
  onCopied,
  trackingLabel = "prompt",
  ariaLabel
}) {
  const [status, setStatus] = useState("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text || "");
      trackEvent("prompt_copy_click", {
        event_category: "Prompt",
        event_label: trackingLabel
      });
      onCopied?.();
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
      aria-label={ariaLabel || label}
      className={`copy-button${copied ? " copied" : ""}${error ? " error" : ""}${
        iconOnly ? " icon-only" : ""
      }${
        className ? ` ${className}` : ""
      }`}
      onClick={handleCopy}
      title={ariaLabel || label}
      type="button"
    >
      {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
      <span className={iconOnly ? "visually-hidden" : ""}>
        {error ? "Copy failed" : copied ? copiedLabel : label}
      </span>
    </button>
  );
}
