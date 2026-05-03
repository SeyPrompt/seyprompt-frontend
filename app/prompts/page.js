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
  const tag = resolvedSearchParams?.tag || "";
  const page = resolvedSearchParams?.page || "1";
  const limit = resolvedSearchParams?.limit || "12";

  const response = await fetchPublicPrompts({
    q,
    category,
    tag,
    page,
    limit
  }).catch(() => ({
    data: [],
    pagination: { total: 0, page: 1, pages: 0 }
  }));

  const currentPage = Number(response.pagination?.page || page || 1);
  const totalPages = Number(response.pagination?.pages || 1);

  return (
    <main className="section">
      <div className="container stack">
        <div>
          <div className="eyebrow">Public library</div>
          <h1 className="page-title">Prompt Library</h1>
          <p className="page-subtitle">
            Search the published SeyPrompt catalog by intent, category, tag, and tool.
            Every listing is server-rendered for a fast first load.
          </p>
        </div>

        <form className="panel form-card search-bar" method="get">
          <input defaultValue={q} name="q" placeholder="Search prompts, tags, tools..." />
          <input defaultValue={category} name="category" placeholder="Filter by category" />
          <input defaultValue={tag} name="tag" placeholder="Filter by tag" />
          <input name="limit" type="hidden" value={limit} />
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
          <>
            <div className="grid prompt-grid">
              {response.data.map((prompt) => (
                <PromptCard key={prompt._id || prompt.id || prompt.slug} prompt={prompt} />
              ))}
            </div>
            <nav className="pagination" aria-label="Prompt pagination">
              <Link
                aria-disabled={currentPage <= 1}
                className="button-secondary"
                href={{
                  pathname: "/prompts",
                  query: { q, category, tag, page: Math.max(currentPage - 1, 1), limit }
                }}
              >
                Previous
              </Link>
              <span className="muted">
                Page {currentPage} of {Math.max(totalPages, 1)}
              </span>
              <Link
                aria-disabled={currentPage >= totalPages}
                className="button-secondary"
                href={{
                  pathname: "/prompts",
                  query: { q, category, tag, page: currentPage + 1, limit }
                }}
              >
                Next
              </Link>
            </nav>
          </>
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
