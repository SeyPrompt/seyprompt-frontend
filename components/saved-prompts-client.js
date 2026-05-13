"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookmarkCheck } from "lucide-react";
import { SAVED_PROMPTS_KEY, readPromptList, writePromptList } from "@/lib/prompt-storage";
import { trackEvent } from "@/lib/analytics";

export function SavedPromptsClient() {
  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    setPrompts(readPromptList(SAVED_PROMPTS_KEY));
  }, []);

  function removePrompt(slug, title) {
    const next = prompts.filter((prompt) => prompt.slug !== slug);
    writePromptList(SAVED_PROMPTS_KEY, next);
    setPrompts(next);
    trackEvent("cta_click", {
      event_category: "Retention",
      event_label: title || slug,
      cta_name: "remove_saved_prompt"
    });
  }

  if (!prompts.length) {
    return (
      <div className="panel empty-state">
        <BookmarkCheck aria-hidden="true" size={30} />
        <h2>Save your favorite prompts and reuse them anytime.</h2>
        <p className="muted">
          Bookmark useful prompts from the library or prompt detail pages. They will appear here on this device.
        </p>
        <Link
          className="button"
          href="/prompts"
          onClick={() =>
            trackEvent("cta_click", {
              event_category: "Retention",
              event_label: "Browse prompts from saved page",
              cta_name: "saved_empty_browse_prompts"
            })
          }
        >
          Go to Prompt Library
        </Link>
      </div>
    );
  }

  return (
    <div className="saved-prompts-grid">
      {prompts.map((prompt) => (
        <article className="card saved-prompt-card" key={prompt.slug}>
          <div>
            <div className="eyebrow">{prompt.category || "General"}</div>
            <h2>{prompt.title}</h2>
            <p className="muted">
              {prompt.prompt.slice(0, 170)}
              {prompt.prompt.length > 170 ? "..." : ""}
            </p>
          </div>
          <div className="pill-row">
            {(prompt.tools || []).slice(0, 3).map((tool) => (
              <span className="pill pill-alt" key={tool}>
                {tool}
              </span>
            ))}
          </div>
          <div className="prompt-actions saved-prompt-actions">
            <Link className="button compact" href={`/prompts/${prompt.slug}`}>
              Open
            </Link>
            <button
              className="button-secondary compact"
              onClick={() => removePrompt(prompt.slug, prompt.title)}
              type="button"
            >
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
