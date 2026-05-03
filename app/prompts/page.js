import Link from "next/link";
import { fetchPublicPrompts } from "@/lib/api";
import { PromptCard } from "@/components/prompt-card";

export const metadata = {
  title: "Prompt Library",
  description: "Browse published prompts by category, tags, and intent."
};

export default async function PromptsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q || "";
  const category = resolvedSearchParams?.category || "";

  const response = await fetchPublicPrompts({
    q,
    category,
    limit: "24"
  }).catch(() => ({
    data: [],
    pagination: { total: 0, pages: 0 }
  }));

  return (
    <main className="section">
      <div className="container stack">
        <div>
          <div className="eyebrow">Public library</div>
          <h1 className="page-title">Prompt Library</h1>
          <p className="page-subtitle">
            Server-rendered prompt listing pages for fast load times and stronger SEO.
          </p>
        </div>

        <form className="panel form-card search-bar" method="get">
          <input defaultValue={q} name="q" placeholder="Search prompts, tags, tools..." />
          <input defaultValue={category} name="category" placeholder="Filter by category" />
          <button className="button" type="submit">
            Search
          </button>
          <Link className="button-secondary" href="/prompts">
            Reset
          </Link>
        </form>

        <div className="section-header">
          <div>
            <strong>{response.pagination?.total || 0}</strong>{" "}
            <span className="muted">published prompts found</span>
          </div>
        </div>

        {response.data?.length ? (
          <div className="grid prompt-grid">
            {response.data.map((prompt) => (
              <PromptCard key={prompt._id} prompt={prompt} />
            ))}
          </div>
        ) : (
          <div className="panel empty-state">
            <h3>No prompts matched your filters.</h3>
            <p className="muted">Try a broader search or clear your filters.</p>
          </div>
        )}
      </div>
    </main>
  );
}
