import { getPromptCategories, getPromptCategoryLabel } from "@/lib/prompt-metadata";

export const RECENTLY_VIEWED_PROMPTS_KEY = "seyprompt_recently_viewed_prompts";

export function promptStorageItem(prompt) {
  return {
    slug: prompt?.slug,
    title: prompt?.title,
    category: getPromptCategoryLabel(prompt),
    categories: getPromptCategories(prompt),
    description: prompt?.description || "",
    prompt: prompt?.prompt || "",
    tags: Array.isArray(prompt?.tags) ? prompt.tags.slice(0, 4) : [],
    tools: Array.isArray(prompt?.tools) ? prompt.tools.slice(0, 4) : []
  };
}

export function readPromptList(key) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = window.localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];

    return Array.isArray(parsed) ? parsed.filter((item) => item?.slug) : [];
  } catch {
    return [];
  }
}

export function writePromptList(key, prompts) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(prompts));
}

export function upsertPromptListItem(key, prompt, maxItems = 12) {
  const item = promptStorageItem(prompt);

  if (!item.slug) {
    return [];
  }

  const next = [
    item,
    ...readPromptList(key).filter((storedPrompt) => storedPrompt.slug !== item.slug)
  ].slice(0, maxItems);

  writePromptList(key, next);
  return next;
}
