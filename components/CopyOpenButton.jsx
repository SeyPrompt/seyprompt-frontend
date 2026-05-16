"use client";

import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Share2 } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export function CopyOpenButton({ description, text, title, url }) {
  const [copied, setCopied] = useState(false);
  const encodedPrompt = encodeURIComponent(text || "");
  const aiTools = [
    {
      name: "ChatGPT",
      url: `https://chat.openai.com/?q=${encodedPrompt}`,
      event: "open_in_chatgpt_click"
    },
    {
      name: "Claude",
      url: `https://claude.ai/new?q=${encodedPrompt}`,
      event: "open_in_claude_click"
    },
    {
      name: "Gemini",
      url: `https://gemini.google.com/app?text=${encodedPrompt}`,
      event: "open_in_gemini_click"
    },
    {
      name: "Perplexity",
      url: `https://www.perplexity.ai/search?q=${encodedPrompt}`,
      event: "open_in_perplexity_click"
    }
  ];

  const handleShare = async () => {
    const shareData = {
      title: title || "SeyPrompt",
      text: description || text || "Discover this AI prompt on SeyPrompt.",
      url: url || window.location.href
    };

    trackEvent("share_click", {
      event_category: "Prompt",
      event_label: title || "prompt"
    });

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Prompt link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleOpenTool = (eventName) => {
    trackEvent(eventName, {
      event_category: "Prompt",
      event_label: title || "prompt"
    });
  };

  return (
    <div className="copy-action-panel">
      <div className="copy-open-group">
        <CopyButton
          className="copy-button-primary"
          copiedLabel="Copied!"
          label="Copy Prompt"
          onCopied={() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 7000);
          }}
          text={text}
          trackingLabel={title || "prompt"}
        />
        {aiTools.map((tool) => (
          <a
            className="button-secondary"
            href={tool.url}
            key={tool.name}
            onClick={() => {
              handleOpenTool(tool.event);
              trackEvent("cta_click", {
                event_category: "Prompt",
                event_label: title || "prompt",
                cta_name: `open_in_${tool.name.toLowerCase()}`
              });
            }}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open in {tool.name}
            <ExternalLink aria-hidden="true" size={16} />
          </a>
        ))}
        <button
          aria-label={`Share ${title || "prompt"}`}
          className="share-prompt-button"
          onClick={handleShare}
          type="button"
        >
          Share
          <Share2 aria-hidden="true" size={16} />
        </button>
      </div>
      <p className={`copy-next-action${copied ? " visible" : ""}`} aria-live="polite">
        Prompt copied. Open it in your AI tool, save it for later, or share it with your team.
      </p>
    </div>
  );
}
