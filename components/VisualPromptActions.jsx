"use client";

import { CopyButton } from "@/components/CopyButton";
import { Share2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const openWithTools = [
  {
    name: "ChatGPT",
    logo: "/icons/chatgpt.svg",
    getUrl: (promptText) => `https://chatgpt.com/?q=${encodeURIComponent(promptText || "")}`,
    event: "open_in_chatgpt_click"
  },
  {
    name: "Gemini",
    logo: "/icons/gemini.svg",
    getUrl: (promptText) => `https://gemini.google.com/app?text=${encodeURIComponent(promptText || "")}`,
    event: "open_in_gemini_click"
  },
  {
    name: "Claude",
    logo: "/icons/claude.svg",
    getUrl: (promptText) => `https://claude.ai/new?q=${encodeURIComponent(promptText || "")}`,
    event: "open_in_claude_click"
  }
];

export function VisualPromptActions({ description, promptText, shareUrl, title }) {
  const handleShare = async () => {
    const shareData = {
      title: title || "SeyPrompt",
      text: description || promptText || "Discover this AI prompt on SeyPrompt.",
      url: shareUrl
    };

    trackEvent("share_click", {
      event_category: "Prompt",
      event_label: title || "visual prompt"
    });

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleOpenWith = async (eventName, toolName) => {
    trackEvent(eventName, {
      event_category: "Prompt",
      event_label: title || "visual prompt",
      cta_name: `open_in_${toolName.toLowerCase()}`
    });

    try {
      await navigator.clipboard.writeText(promptText || "");
    } catch (_error) {
      // Tool URL still carries the prompt; clipboard is only a fallback.
    }
  };

  return (
    <span className="visual-prompt-actions">
      <span className="visual-prompt-primary-actions">
        <CopyButton
          className="visual-prompt-copy-button"
          copiedLabel="Copied"
          label="Copy"
          text={promptText}
          trackingLabel={title || "visual prompt"}
        />
        <button
          aria-label={`Share ${title || "visual prompt"}`}
          className="visual-prompt-share-button"
          onClick={handleShare}
          title={`Share ${title || "visual prompt"}`}
          type="button"
        >
          <Share2 aria-hidden="true" size={16} />
        </button>
      </span>
      <span className="visual-open-with" aria-label="Open prompt with AI tools">
        <span className="visual-open-with-label">Open with</span>
        <span className="visual-open-with-tools">
          {openWithTools.map((tool) => (
            <a
              aria-label={`Open in ${tool.name}`}
              className="visual-open-with-tool"
              href={tool.getUrl(promptText)}
              key={tool.name}
              onClick={() => handleOpenWith(tool.event, tool.name)}
              rel="noopener noreferrer"
              target="_blank"
              title={`Open in ${tool.name}`}
            >
              <img alt="" aria-hidden="true" src={tool.logo} />
            </a>
          ))}
        </span>
      </span>
    </span>
  );
}
