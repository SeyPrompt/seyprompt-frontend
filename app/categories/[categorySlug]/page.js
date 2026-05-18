import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublicCategories, fetchPublicPrompts } from "@/lib/api";
import { PromptLibraryView } from "@/components/prompt-library-view";
import { RecentlyViewedPrompts } from "@/components/recently-viewed-prompts";
import {
  breadcrumbSchema,
  categorySchema,
  createCategoryMetadata,
  getCategoryBySlug,
  getCategoryPath,
  PROMPT_CATEGORIES,
  slugifyCategory
} from "@/lib/seo";

async function getPublicCategories() {
  const categories = await fetchPublicCategories(100).catch(() => []);

  if (categories.length) {
    return categories.map((category) => ({
      name: category.name,
      slug: category.slug
    }));
  }

  return PROMPT_CATEGORIES.map((category) => ({
    name: category,
    slug: slugifyCategory(category)
  }));
}

async function resolveCategory(categorySlug) {
  const categories = await getPublicCategories();
  const normalizedSlug = slugifyCategory(categorySlug);

  return (
    categories.find((category) => {
      const candidateSlug = slugifyCategory(category.slug || category.name);
      const compactCandidateSlug = candidateSlug.replace(/-and-/g, "-");
      const compactSlug = normalizedSlug.replace(/-and-/g, "-");

      return candidateSlug === normalizedSlug || compactCandidateSlug === compactSlug;
    }) || null
  );
}

export async function generateStaticParams() {
  const categories = await getPublicCategories();

  return categories.map((category) => ({
    categorySlug: category.slug || slugifyCategory(category.name)
  }));
}

export async function generateMetadata({ params }) {
  const { categorySlug } = await params;
  const categoryRecord = await resolveCategory(categorySlug);
  const category = categoryRecord?.name || getCategoryBySlug(categorySlug);

  if (!category) {
    return {
      title: "Category Not Found",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return createCategoryMetadata(category, categoryRecord?.slug || slugifyCategory(categorySlug));
}

export default async function CategoryPage({ params, searchParams }) {
  const { categorySlug } = await params;
  const resolvedSearchParams = await searchParams;
  const categoryRecord = await resolveCategory(categorySlug);
  const category = categoryRecord?.name || getCategoryBySlug(categorySlug);
  const canonicalSlug = categoryRecord?.slug || slugifyCategory(categorySlug);

  if (!category) {
    notFound();
  }

  const q = resolvedSearchParams?.q || "";
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

  const currentPage = Number(response.pagination?.page || page || 1);
  const totalPages = Number(response.pagination?.pages || 1);
  const schemas = [
    categorySchema(category, canonicalSlug),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Prompts", path: "/prompts" },
      { name: category, path: getCategoryPath(canonicalSlug) }
    ])
  ];

  return (
    <main className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <div className="container stack">
        <div>
          <h1 className="page-title">{category} AI Prompts</h1>
          <p className="page-subtitle">
            Explore ready-made {category} AI prompts for ChatGPT, Claude, Gemini,
            Midjourney and other AI tools.
          </p>
        </div>

        <PromptLibraryView
          category={category}
          limit={limit}
          loadFailed={Boolean(response.loadFailed)}
          prompts={response.data || []}
          q={q}
          tag={tag}
          tool={tool}
          total={response.pagination?.total || 0}
        >
          <nav className="pagination" aria-label={`${category} prompt pagination`}>
            <Link
              aria-disabled={currentPage <= 1}
              className="button-secondary"
              href={{
                pathname: `/categories/${categorySlug}`,
                query: { q, tag, tool, page: Math.max(currentPage - 1, 1), limit }
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
                pathname: `/categories/${categorySlug}`,
                query: { q, tag, tool, page: currentPage + 1, limit }
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
