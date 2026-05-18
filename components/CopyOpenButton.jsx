"use client";

import { CopyButton } from "@/components/CopyButton";
import { Share2 } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { SavedPromptButton } from "@/components/saved-prompt-button";

export function CopyOpenButton({ description, text, title, url }) {
  const [copied, setCopied] = useState(false);
  const encodedPrompt = encodeURIComponent(text || "");
  const aiTools = [
    {
      name: "ChatGPT",
      logo: "/icons/chatgpt.svg",
      url: `https://chat.openai.com/?q=${encodedPrompt}`,
      event: "open_in_chatgpt_click"
    },
    {
      name: "Claude",
      logo: "/icons/claude.svg",
      url: `https://claude.ai/new?q=${encodedPrompt}`,
      event: "open_in_claude_click"
    },
    {
      name: "Gemini",
      logo: "/icons/gemini.svg",
      url: `https://gemini.google.com/app?text=${encodedPrompt}`,
      event: "open_in_gemini_click"
    },
    {
      name: "Perplexity",
      logo: "/icons/perplexity-ai-icon.svg",
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
      <div className="prompt-action-layout">
        <div className="prompt-primary-actions">
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
          <button
            aria-label={`Share ${title || "prompt"}`}
            className="share-prompt-button"
            onClick={handleShare}
            type="button"
          >
            Share
            <Share2 aria-hidden="true" size={16} />
          </button>
           <SavedPromptButton className="prompt-save-action" prompt={prompt} />
        </div>

        <div className="ai-tool-group" aria-label="Open prompt in AI tools">
          <span className="ai-tool-group-label">Open with</span>
          <div className="ai-tool-list">
            {aiTools.map((tool) => (
              <a
                aria-label={`Open in ${tool.name}`}
                className="ai-tool-button"
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
                title={`Open in ${tool.name}`}
              >
                <img alt="" aria-hidden="true" className="ai-tool-logo" src={tool.logo} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <p className={`copy-next-action${copied ? " visible" : ""}`} aria-live="polite">
        Prompt copied. Open it in your AI tool, save it for later, or share it with your team.
      </p>
    </div>
  );
}
