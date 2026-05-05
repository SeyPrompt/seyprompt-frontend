import Link from "next/link";
import { fetchPublicPrompts } from "@/lib/api";
import { PromptLibraryView } from "@/components/prompt-library-view";

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
          <h1 className="page-title">Prompt Library</h1>
          <p className="page-subtitle">
            Search the published SeyPrompt catalog by intent, category, tag, and tool.
          </p>
        </div>

        <PromptLibraryView
          category={category}
          limit={limit}
          prompts={response.data || []}
          q={q}
          tag={tag}
          total={response.pagination?.total || 0}
        >
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
        </PromptLibraryView>
      </div>
    </main>
  );
}
