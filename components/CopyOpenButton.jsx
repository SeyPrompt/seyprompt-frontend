"use client";

import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Share2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function CopyOpenButton({ description, text, title, url }) {
  const chatGptUrl = `https://chat.openai.com/?q=${encodeURIComponent(text || "")}`;

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

  const handleOpenChatGpt = () => {
    trackEvent("open_in_chatgpt_click", {
      event_category: "Prompt",
      event_label: title || "prompt"
    });
  };

  return (
    <div className="copy-open-group">
      <CopyButton
        className="copy-button-primary"
        copiedLabel="Copied!"
        label="Copy Prompt"
        text={text}
        trackingLabel={title || "prompt"}
      />
      <a
        className="button-secondary"
        href={chatGptUrl}
        onClick={handleOpenChatGpt}
        rel="noopener noreferrer"
        target="_blank"
      >
        Open in ChatGPT
        <ExternalLink aria-hidden="true" size={16} />
      </a>
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
  );
}
