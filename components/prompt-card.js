"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { getPromptCategories, getPrimaryPromptCategory } from "@/lib/prompt-metadata";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { SavedPromptButton } from "@/components/saved-prompt-button";
import { ToolBadges } from "@/components/tool-badges";

export function PromptCard({ prompt }) {
  const tools = prompt.tools || [];
  const categories = getPromptCategories(prompt);
  const primaryCategory = getPrimaryPromptCategory(prompt);
  const CategoryIcon = getCategoryIcon(primaryCategory);
  const description = prompt.description || prompt.prompt || "";
  const promptTags = prompt.tags || [];
  const tagPills = promptTags.length
    ? promptTags.slice(0, 1).map((tag) => ({ label: `#${tag}`, key: `tag-${tag}` }))
    : (categories.length ? categories.slice(0, 2) : ["General"]).map((category) => ({
        label: category,
        key: `category-${category}`
      }));

  return (
    <article className="card prompt-card">
      <SavedPromptButton className="prompt-card-save" iconOnly prompt={prompt} />
      <div className="prompt-card-main">
        <div className="prompt-icon category-icon" aria-hidden="true">
          <CategoryIcon size={22} />
        </div>
        <div className="prompt-card-copy">
          <div className="eyebrow">{primaryCategory || "General"}</div>
          <h3>{prompt.title}</h3>
          <p className="muted prompt-card-description">
            {description.slice(0, 150)}
            {description.length > 150 ? "..." : ""}
          </p>
          <div className="pill-row prompt-card-tags">
            {tagPills.map((tag) => (
              <span className="pill" key={tag.key}>
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="prompt-card-footer">
        <ToolBadges tools={tools} />
        <div className="prompt-actions">
          <Link
            className="button compact"
            href={`/prompts/${prompt.slug}`}
            onClick={() =>
              trackEvent("prompt_card_click", {
                event_category: "Prompt",
                event_label: prompt.slug || prompt.title,
                prompt_slug: prompt.slug,
                prompt_category: primaryCategory || "General"
              })
            }
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
