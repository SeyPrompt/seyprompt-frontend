"use client";

import { useEffect } from "react";
import { recordPromptView } from "@/lib/prompt-views";
import { RECENTLY_VIEWED_PROMPTS_KEY, upsertPromptListItem } from "@/lib/prompt-storage";

const PROMPT_VIEW_SESSION_PREFIX = "seyprompt_view_recorded:";

export function RecordPromptView({ prompt }) {
  useEffect(() => {
    upsertPromptListItem(RECENTLY_VIEWED_PROMPTS_KEY, prompt, 8);

    const slug = prompt?.slug;

    if (!slug) {
      return;
    }

    const storageKey = `${PROMPT_VIEW_SESSION_PREFIX}${slug}`;

    try {
      if (window.sessionStorage.getItem(storageKey)) {
        return;
      }

      window.sessionStorage.setItem(storageKey, "1");
    } catch (_err) {
      // Browsers can disable sessionStorage; views should still be best-effort.
    }

    recordPromptView(slug).catch(() => {
      try {
        window.sessionStorage.removeItem(storageKey);
      } catch (_err) {
        // Ignore storage failures after the network failure.
      }
    });
  }, [prompt]);

  return null;
}
