"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  SAVED_PROMPTS_KEY,
  promptStorageItem,
  readPromptList,
  writePromptList
} from "@/lib/prompt-storage";
import { trackEvent } from "@/lib/analytics";

export function SavedPromptButton({ prompt, className = "" }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readPromptList(SAVED_PROMPTS_KEY).some((item) => item.slug === prompt?.slug));
  }, [prompt?.slug]);

  function toggleSaved() {
    if (!prompt?.slug) {
      return;
    }

    const storedPrompts = readPromptList(SAVED_PROMPTS_KEY);
    const isSaved = storedPrompts.some((item) => item.slug === prompt.slug);
    const next = isSaved
      ? storedPrompts.filter((item) => item.slug !== prompt.slug)
      : [promptStorageItem(prompt), ...storedPrompts].slice(0, 100);

    writePromptList(SAVED_PROMPTS_KEY, next);
    setSaved(!isSaved);
    trackEvent("cta_click", {
      event_category: "Retention",
      event_label: prompt.title || prompt.slug,
      cta_name: isSaved ? "remove_saved_prompt" : "save_prompt"
    });
  }

  return (
    <button
      aria-pressed={saved}
      className={`save-prompt-button${saved ? " saved" : ""}${className ? ` ${className}` : ""}`}
      onClick={toggleSaved}
      title={saved ? "Saved prompt" : "Save prompt"}
      type="button"
    >
      {saved ? (
        <BookmarkCheck aria-hidden="true" size={16} />
      ) : (
        <Bookmark aria-hidden="true" size={16} />
      )}
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
