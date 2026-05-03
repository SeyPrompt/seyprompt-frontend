import Link from "next/link";

export function PromptCard({ prompt }) {
  return (
    <article className="card prompt-card">
      <div className="eyebrow">{prompt.category || "General"}</div>
      <div>
        <h3>{prompt.title}</h3>
        <p className="muted">
          {prompt.prompt.slice(0, 150)}
          {prompt.prompt.length > 150 ? "..." : ""}
        </p>
      </div>
      <div className="pill-row">
        {(prompt.tags || []).slice(0, 3).map((tag) => (
          <span className="pill" key={tag}>
            #{tag}
          </span>
        ))}
      </div>
      <Link className="button-secondary" href={`/prompts/${prompt.slug}`}>
        View Prompt
      </Link>
    </article>
  );
}
