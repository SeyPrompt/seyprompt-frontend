"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { RECENTLY_VIEWED_PROMPTS_KEY, readPromptList } from "@/lib/prompt-storage";

export function RecentlyViewedPrompts({ excludeSlug = "" }) {
  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    setPrompts(
      readPromptList(RECENTLY_VIEWED_PROMPTS_KEY)
        .filter((prompt) => prompt.slug !== excludeSlug)
        .slice(0, 4)
    );
  }, [excludeSlug]);

  if (!prompts.length) {
    return null;
  }

  return (
    <section className="recent-prompts">
      <div className="section-header recent-prompts-header">
        <div>
          <div className="eyebrow">Recently viewed</div>
          <h2>Pick up where you left off</h2>
        </div>
      </div>
      <div className="recent-prompts-grid">
        {prompts.map((prompt) => (
          <Link className="card recent-prompt-card" href={`/prompts/${prompt.slug}`} key={prompt.slug}>
            <Clock3 aria-hidden="true" size={18} />
            <span>
              <strong>{prompt.title}</strong>
              <small>{prompt.category || "Prompt"}</small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
