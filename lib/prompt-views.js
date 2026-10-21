"use client";

import { apiUrl } from "@/utils/api";

export async function recordPromptView(slug) {
  if (!slug) return null;

  const response = await fetch(apiUrl(`/api/public/prompts/${encodeURIComponent(slug)}/view`), {
    method: "POST",
    cache: "no-store"
  });

  if (!response.ok) throw new Error("Unable to record prompt view.");
  return response.json();
}
