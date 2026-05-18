export function normalizeCategories(categories = [], legacyCategory = "") {
  const values = Array.isArray(categories) ? categories : [];
  const seen = new Set();
  const normalized = [];

  for (const value of values) {
    const category = String(value || "").trim();
    const key = category.toLowerCase();

    if (!category || seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(category);
  }

  if (normalized.length) {
    return normalized;
  }

  const fallback = String(legacyCategory || "").trim();
  return fallback ? [fallback] : [];
}

export function getPromptCategories(prompt) {
  return normalizeCategories(prompt?.categories, prompt?.category);
}

export function getPrimaryPromptCategory(prompt) {
  return getPromptCategories(prompt)[0] || "";
}

export function getPromptCategoryLabel(prompt, fallback = "General") {
  const categories = getPromptCategories(prompt);
  return categories.length ? categories.join(", ") : fallback;
}
