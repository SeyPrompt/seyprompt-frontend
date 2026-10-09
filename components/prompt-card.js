"use client";

import { trackEvent } from "@/lib/analytics";
import { PromptAccessLink } from "@/components/PromptAccessLink";
import { PromptCheckoutModal } from "@/components/PromptCheckoutModal";
import { formatPromptPrice, getPromptPricingType } from "@/lib/prompt-pricing";
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
  const pricingType = getPromptPricingType(prompt);
  const tagPills = promptTags.length
    ? promptTags.slice(0, 1).map((tag) => ({ label: `#${tag}`, key: `tag-${tag}` }))
    : (categories.length ? categories.slice(0, 2) : ["General"]).map((category) => ({
        label: category,
        key: `category-${category}`
      }));

  return (
    <article className="card prompt-card">
      <div className="prompt-card-top">
        <div className="prompt-card-category">
          <span className="prompt-icon category-icon" aria-hidden="true">
            <CategoryIcon size={22} />
          </span>
          <span>
            <span className="prompt-card-kicker">Prompt</span>
            <span className="prompt-card-category-name">{primaryCategory || "General"}</span>
          </span>
        </div>
        <div className="prompt-card-controls">
          <span className={`price-badge prompt-card-price price-badge-${pricingType}`}>{formatPromptPrice(prompt)}</span>
          <SavedPromptButton className="prompt-card-save" iconOnly prompt={prompt} />
        </div>
      </div>

      <div className="prompt-card-copy">
        <h3>
          <PromptAccessLink
            href={`/prompts/${prompt.slug}`}
            onClick={() =>
              trackEvent("prompt_card_title_click", {
                event_category: "Prompt",
                event_label: prompt.slug || prompt.title,
                prompt_slug: prompt.slug,
                prompt_category: primaryCategory || "General"
              })
            }
          >
            {prompt.title}
          </PromptAccessLink>
        </h3>
        <p className="muted prompt-card-description">
          {description.slice(0, 170)}
          {description.length > 170 ? "..." : ""}
        </p>
        <div className="pill-row prompt-card-tags">
          {tagPills.map((tag) => (
            <span className="pill" key={tag.key}>
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      <div className="prompt-card-footer">
        <ToolBadges tools={tools} />
        <div className="prompt-actions">
          {pricingType === "premium" ? (
            <PromptCheckoutModal
              prompt={prompt}
              triggerClassName="button compact prompt-card-unlock"
              triggerLabel="Unlock"
            />
          ) : (
            <PromptAccessLink
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
            </PromptAccessLink>
          )}
        </div>
      </div>
    </article>
  );
}
