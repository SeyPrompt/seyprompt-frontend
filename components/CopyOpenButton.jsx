"use client";

import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";

export function CopyOpenButton({ text }) {
  return (
    <div className="copy-open-group">
      <CopyButton
        className="copy-button-primary"
        copiedLabel="Copied!"
        label="Copy Prompt"
        text={text}
      />
      <a
        className="open-chatgpt-button"
        href="https://chat.openai.com/"
        rel="noopener noreferrer"
        target="_blank"
      >
        Open in ChatGPT
        <ExternalLink aria-hidden="true" size={16} />
      </a>
    </div>
  );
}
