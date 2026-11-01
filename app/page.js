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
  const category = collection || params?.q && !params?.category ? "" : categories.some(row => row.slug === params?.category) ? params.category : categories[0]?.slug || "";
  const query = typeof params?.q === "string" ? params.q.slice(0, 200) : "";
  const response = await fetchPublicPrompts({ discoverCategory: category, discoverCollection: collection?.slug, q: query, discoverSort: "newest", limit: "30" }).catch(() => ({ data: [], loadFailed: true }));
  return (
    <main className="home-reference-page discover-page">
      <HomeVisualFeed categories={categories} collection={collection || null}
        initialCategory={category} initialQuery={query} initialPrompts={response.data || []}
        initialHasMore={Number(response.pagination?.pages || 0) > 1} initialLoadFailed={Boolean(response.loadFailed)} />
    </main>
  );
}
