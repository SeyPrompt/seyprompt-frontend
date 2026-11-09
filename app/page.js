import HomeVisualFeed from "@/components/HomeVisualFeed";
import { fetchPublicDiscovery, fetchPublicPrompts, fetchPublicTaxonomyRecord } from "@/lib/api";
import { discoveryCategories } from "@/lib/discovery-categories";
import { createPageMetadata, DEFAULT_TITLE, SITE_DESCRIPTION } from "@/lib/seo";

export async function generateMetadata({ searchParams }) {
  const params = await searchParams || {};
  const kind = params.collection ? 'collections' : params.category ? 'categories' : null;
  const record = kind ? await fetchPublicTaxonomyRecord(kind, params.collection || params.category) : null;
  return { ...createPageMetadata({ absoluteTitle: DEFAULT_TITLE, description: SITE_DESCRIPTION, path: record?.path || '/' }), ...(Object.keys(params).length ? { robots: { index: false, follow: true } } : {}) };
}

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const catalog = await fetchPublicDiscovery().catch(() => null);
  const categories = discoveryCategories(catalog);
  const collection = catalog?.collections?.find(row => row.slug === params?.collection);
  const requestedCategory = typeof params?.category === "string" ? params.category : "";
  const query = typeof params?.q === "string" ? params.q.slice(0, 200) : "";
  const pricing = ["free", "premium"].includes(params?.pricing) ? params.pricing : "";
  const tool = typeof params?.tool === "string" ? params.tool : "";
  const tag = typeof params?.tag === "string" ? params.tag : "";
  const selectedCategory = categories.find(row => row.slug === requestedCategory);
  const category = collection ? "" : selectedCategory?.slug
    || (requestedCategory || query || pricing || tool || tag ? "" : categories[0]?.slug || "");
  const legacyCategory = collection || selectedCategory ? "" : requestedCategory;
  const response = await fetchPublicPrompts({
    discoverCategory: category, discoverCollection: collection?.slug,
    category: legacyCategory, tool, tag, q: query, pricing, discoverSort: "newest", limit: "30"
  }).catch(() => ({ data: [], loadFailed: true }));
  return (
    <main className="home-reference-page discover-page">
      <HomeVisualFeed categories={categories} collection={collection || null}
        initialCategory={category} initialQuery={query} initialPricing={pricing}
        legacyCategory={legacyCategory} tool={collection ? "" : tool} tag={collection ? "" : tag}
        initialPrompts={response.data || []}
        initialHasMore={Number(response.pagination?.pages || 0) > 1} initialLoadFailed={Boolean(response.loadFailed)} />
    </main>
  );
}
