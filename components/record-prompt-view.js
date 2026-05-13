"use client";

import { useEffect } from "react";
import { RECENTLY_VIEWED_PROMPTS_KEY, upsertPromptListItem } from "@/lib/prompt-storage";

export function RecordPromptView({ prompt }) {
  useEffect(() => {
    upsertPromptListItem(RECENTLY_VIEWED_PROMPTS_KEY, prompt, 8);
  }, [prompt]);

  return null;
}
