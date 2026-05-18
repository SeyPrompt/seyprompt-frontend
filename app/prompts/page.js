import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchPublicPrompts } from "@/lib/api";
import { PromptLibraryView } from "@/components/prompt-library-view";
import { RecentlyViewedPrompts } from "@/components/recently-viewed-prompts";
import { createCategoryMetadata, createPageMetadata } from "@/lib/seo";

const categoryDescriptions = {
  Marketing: "Discover the best AI marketing prompts for ChatGPT, Claude, and more.",
  Coding: "Find coding AI prompts for debugging, explaining code, writing tests, and building faster.",
  Business: "Explore business AI prompts for strategy, planning, operations, and decision-making.",
  Resume: "Browse resume AI prompts for stronger applications, career stories, and job search workflows.",
  Design: "Discover design and image prompts for Midjourney, Canva, ChatGPT, and creative workflows.",
  "Image Prompts": "Explore AI image prompts for Midjourney, visual concepts, campaigns, and creative direction.",
  "Social Media": "Find social media AI prompts for captions, content calendars, hooks, and short-form ideas."
};

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const category = resolvedSearchParams?.category || "";
  const tag = resolvedSearchParams?.tag || "";
  const tool = resolvedSearchParams?.tool || "";
  const q = resolvedSearchParams?.q || "";

  if (category) {
    return createCategoryMetadata(category);
  }

  if (tag) {
    return createPageMetadata({
      title: `#${tag} AI Prompts`,
      description: `Browse SeyPrompt prompts tagged ${tag} for ChatGPT, Claude, Midjourney, and more.`,
      path: `/prompts?tag=${encodeURIComponent(tag)}`
    });
  }

  if (tool) {
    return createPageMetadata({
      title: `${tool} AI Prompts`,
      description: `Browse SeyPrompt prompts for ${tool}.`,
      path: `/prompts?tool=${encodeURIComponent(tool)}`
    });
  }

  if (q) {
    return createPageMetadata({
      title: `Search AI Prompts for ${q}`,
      description: `Search SeyPrompt for AI prompts related to ${q}.`,
      path: `/prompts?q=${encodeURIComponent(q)}`
    });
  }

  return createPageMetadata({
    title: "Prompt Library",
    description: "Browse published AI prompts by category, tags, intent, and tool.",
    path: "/prompts"
  });
}

export default async function PromptsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q || "";
  const category = resolvedSearchParams?.category || "";
  const tag = resolvedSearchParams?.tag || "";
  const tool = resolvedSearchParams?.tool || "";
  const page = resolvedSearchParams?.page || "1";
  const limit = resolvedSearchParams?.limit || "12";

  const response = await fetchPublicPrompts({
    q,
    category,
    tag,
    tool,
    page,
    limit
  }).catch(() => ({
    data: [],
    loadFailed: true,
    pagination: { total: 0, page: 1, pages: 0 }
  }));

  if (category && !response.loadFailed && !response.data?.length && !categoryDescriptions[category]) {
    notFound();
  }

  const visiblePrompts = tool
    ? (response.data || []).filter((prompt) => (prompt.tools || []).includes(tool))
    : response.data || [];
  const needsClientToolFilter = tool && visiblePrompts.length !== (response.data || []).length;
  const filteredResponse = needsClientToolFilter
    ? {
        ...response,
        data: visiblePrompts,
        pagination: {
          ...response.pagination,
          total: visiblePrompts.length,
          pages: 1
        }
      }
    : response;

  const currentPage = Number(filteredResponse.pagination?.page || page || 1);
  const totalPages = Number(filteredResponse.pagination?.pages || 1);

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
          loadFailed={Boolean(filteredResponse.loadFailed)}
          prompts={filteredResponse.data || []}
          q={q}
          tag={tag}
          tool={tool}
          total={filteredResponse.pagination?.total || 0}
        >
          <nav className="pagination" aria-label="Prompt pagination">
            <Link
              aria-disabled={currentPage <= 1}
              className="button-secondary"
              href={{
                pathname: "/prompts",
                query: { q, category, tag, tool, page: Math.max(currentPage - 1, 1), limit }
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
                query: { q, category, tag, tool, page: currentPage + 1, limit }
              }}
            >
              Next
            </Link>
          </nav>
        </PromptLibraryView>
        <RecentlyViewedPrompts />
      </div>
    </main>
  );
}
