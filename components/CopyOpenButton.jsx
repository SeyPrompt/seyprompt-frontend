"use client";

import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Share2 } from "lucide-react";

export function CopyOpenButton({ text }) {

  const handleShare = async () => {
  const shareData = {
    title: prompt.title,
    text: prompt.description,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);

      alert("Prompt link copied to clipboard!");
    }
  } catch (error) {
    console.error("Share failed:", error);
  }
};

  return (
    <div className="copy-open-group">
      <CopyButton
        className="copy-button-primary"
        copiedLabel="Copied!"
        label="Copy Prompt"
        text={text}
      />
      <button
        type="button"
        className="share-prompt-button"
        onClick={handleShare}
      >
        Share
        <Share2 aria-hidden="true" size={16} />
      </button>
    </div>
  );
}
