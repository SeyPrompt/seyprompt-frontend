import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";

export function PromptCard({ prompt }) {
  const tools = prompt.tools || [];

  return (
    <article className="card prompt-card">
      <div className="prompt-card-main">
        <div className="prompt-icon" aria-hidden="true">
          {prompt.category?.slice(0, 1) || "P"}
        </div>
        <div className="prompt-card-copy">
          <div className="eyebrow">{prompt.category || "General"}</div>
          <h3>{prompt.title}</h3>
          <p className="muted">
            {prompt.prompt.slice(0, 150)}
            {prompt.prompt.length > 150 ? "..." : ""}
          </p>
          <div className="pill-row">
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
          {tools.slice(0, 2).map((tool) => (
            <span className="pill pill-alt" key={tool}>
              {tool}
            </span>
          ))}
        </div>
        <div className="prompt-actions">
          <CopyButton className="compact" text={prompt.prompt} />
          <Link className="button compact" href={`/prompts/${prompt.slug}`}>
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
