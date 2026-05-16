"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { SavedPromptButton } from "@/components/saved-prompt-button";

export function PromptCard({ prompt }) {
  const tools = prompt.tools || [];
  const [firstTool, ...remainingTools] = tools;
  const CategoryIcon = getCategoryIcon(prompt.category);

  return (
    <article className="card prompt-card">
      <div className="prompt-card-main">
        <div className="prompt-icon category-icon" aria-hidden="true">
          <CategoryIcon size={22} />
        </div>
        <div className="prompt-card-copy">
          <div className="eyebrow">{prompt.category || "General"}</div>
          <h3>{prompt.title}</h3>
          <p className="muted prompt-card-description">
            {prompt.prompt.slice(0, 150)}
            {prompt.prompt.length > 150 ? "..." : ""}
          </p>
          <div className="pill-row prompt-card-tags">
            {(prompt.tags || []).slice(0, 3).map((tag) => (
              <span className="pill" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="prompt-card-footer">
        <div className="pill-row tool-row">
          {firstTool ? <span className="pill pill-alt">{firstTool}</span> : null}
          {remainingTools.length ? (
            <span className="pill pill-alt tool-count-badge">+{remainingTools.length}</span>
          ) : null}
        </div>
        <div className="prompt-actions">
          <Link
            className="button compact"
            href={`/prompts/${prompt.slug}`}
            onClick={() =>
              trackEvent("prompt_card_click", {
                event_category: "Prompt",
                event_label: prompt.slug || prompt.title,
                prompt_slug: prompt.slug,
                prompt_category: prompt.category || "General"
              })
            }
          >
            View
          </Link>
          <SavedPromptButton prompt={prompt} />
        </div>
      </div>
    </article>
  );
}
