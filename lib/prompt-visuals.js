import { Clapperboard, ImageIcon } from "lucide-react";
import { getCategoryPath } from "@/lib/seo";
import { getPromptCategories } from "@/lib/prompt-metadata";

const visualTerms = ["visual", "visumal", "image", "video"];

export function normalizeText(value) {
  return String(value || "").trim();
}

export function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

export function toTextArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean);
  }

  return [normalizeText(value)].filter(Boolean);
}

export function getPromptOutputType(prompt) {
  return normalizeLower(
    prompt?.outputType ||
      prompt?.output_type ||
      prompt?.sampleOutputType ||
      prompt?.sampleOutput?.type
  );
}

export function getSampleOutputValue(prompt) {
  const sampleOutput = prompt?.sampleOutput || {};

  return normalizeText(
    sampleOutput.value ||
      sampleOutput.url ||
      prompt?.sampleOutputUrl ||
      prompt?.sample_output_url
  );
}

export function isPlayableVideoSource(value) {
  const source = normalizeText(value);

  return (
    /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(source) ||
    /res\.cloudinary\.com\/.*\/video\/upload\//i.test(source)
  );
}

export function getPromptVideoSource(prompt) {
  const outputType = getPromptOutputType(prompt);
  const sampleOutputType = normalizeLower(prompt?.sampleOutput?.type || prompt?.sampleOutputType);
  const sampleOutputValue = getSampleOutputValue(prompt);
  const sampleOutputPreview = normalizeText(prompt?.sampleOutput?.watermarkedPreviewUrl);
  const promptPreview = normalizeText(prompt?.watermarkedPreviewUrl);
  const videoSource =
    outputType.includes("video") || sampleOutputType.includes("video")
      ? sampleOutputPreview || promptPreview || sampleOutputValue
      : sampleOutputValue;

  if (!videoSource || !isPlayableVideoSource(videoSource)) {
    return "";
  }

  if (
    outputType.includes("video") ||
    sampleOutputType.includes("video") ||
    isPlayableVideoSource(sampleOutputValue)
  ) {
    return videoSource;
  }

  return "";
}

export function getPromptImageSource(prompt) {
  const sampleOutputValue = getSampleOutputValue(prompt);
  const sampleOutputPreview = normalizeText(prompt?.sampleOutput?.watermarkedPreviewUrl);
  const promptPreview = normalizeText(prompt?.watermarkedPreviewUrl);
  const outputType = getPromptOutputType(prompt);
  const sampleOutputType = normalizeLower(prompt?.sampleOutput?.type || prompt?.sampleOutputType);

  if (outputType.includes("image") || sampleOutputType.includes("image")) {
    return sampleOutputPreview || promptPreview || sampleOutputValue;
  }

  return (
    normalizeText(prompt?.image) ||
    normalizeText(prompt?.thumbnail) ||
    normalizeText(prompt?.sampleOutput?.thumbnail)
  );
}

function hasVisualTerm(values) {
  return values.some((value) => {
    const lowered = normalizeLower(value);

    return visualTerms.some((term) => lowered.includes(term));
  });
}

export function isVideoPrompt(prompt) {
  const outputType = getPromptOutputType(prompt);
  const categories = getPromptCategories(prompt);
  const tags = toTextArray(prompt?.tags);

  return outputType.includes("video") || [...categories, ...tags].some((value) => normalizeLower(value).includes("video"));
}

export function isVisualPrompt(prompt) {
  const outputType = getPromptOutputType(prompt);
  const categories = getPromptCategories(prompt);
  const tags = toTextArray(prompt?.tags);
  const hasVisualOutput = Boolean(getPromptVideoSource(prompt)) || Boolean(getPromptImageSource(prompt));

  return hasVisualOutput && (hasVisualTerm([outputType]) || hasVisualTerm([...categories, ...tags]));
}

export function dedupePrompts(prompts = []) {
  const seen = new Set();
  const uniquePrompts = [];

  for (const prompt of prompts) {
    const key = prompt?.slug || prompt?._id || prompt?.id || prompt?.title;

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniquePrompts.push(prompt);
  }

  return uniquePrompts;
}

export function categoryHref(category) {
  const label = normalizeText(category?.name || category?.label || category || "");
  const slug = normalizeLower(category?.slug);
  const loweredLabel = label.toLowerCase();

  if (loweredLabel.includes("image") || slug === "image-prompts") {
    return "/prompts?category=Image%20Prompts";
  }

  if (loweredLabel.includes("video") || slug === "video-prompts") {
    return "/prompts?category=Video%20Prompts";
  }

  return category?.slug ? `/categories/${category.slug}` : getCategoryPath(label);
}

function getPromptCategoryChips(prompts = []) {
  const promptCategories = new Map();

  for (const prompt of prompts) {
    for (const category of getPromptCategories(prompt)) {
      const label = normalizeText(category);

      if (label && !promptCategories.has(label.toLowerCase())) {
        promptCategories.set(label.toLowerCase(), {
          label,
          href: categoryHref(label)
        });
      }
    }
  }

  return promptCategories;
}

export function buildCategoryChips(categories = [], prompts = [], limit = 15, options = {}) {
  const promptCategories = getPromptCategoryChips(prompts);
  const requirePromptMatch = options.requirePromptMatch !== false;
  const requireDbCategory = Boolean(options.requireDbCategory);
  const apiCategories = categories
    .map((category) => ({
      label: normalizeText(category.name || category.label || category),
      href: categoryHref(category)
    }))
    .filter((category) => {
      if (!category.label) {
        return false;
      }

      return !requirePromptMatch || promptCategories.has(category.label.toLowerCase());
    });

  if (apiCategories.length || requireDbCategory) {
    return apiCategories.slice(0, limit);
  }

  return [...promptCategories.values()].slice(0, limit);
}

export function buildTrendingTags(prompts = [], categories = [], limit = 5) {
  const values = new Map();

  for (const prompt of prompts) {
    for (const tag of toTextArray(prompt?.tags)) {
      if (!values.has(tag.toLowerCase())) {
        values.set(tag.toLowerCase(), tag);
      }
    }

    for (const category of getPromptCategories(prompt)) {
      if (!values.has(category.toLowerCase())) {
        values.set(category.toLowerCase(), category);
      }
    }
  }

  for (const category of categories) {
    const label = normalizeText(category.name || category.label || category);

    if (label && !values.has(label.toLowerCase())) {
      values.set(label.toLowerCase(), label);
    }
  }

  return [...values.values()].slice(0, limit);
}

export function promptToolLabel(prompt) {
  const tools = toTextArray(prompt?.tools);
  const tool = tools[0] || prompt?.tool || prompt?.aiTool;

  if (tool) {
    return tool;
  }

  return isVideoPrompt(prompt) ? "Video prompt" : "Image prompt";
}

export function visualPromptIcon(prompt) {
  return isVideoPrompt(prompt) ? Clapperboard : ImageIcon;
}
