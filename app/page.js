import HomeVisualFeed from "@/components/HomeVisualFeed";
import {
  fetchPublicCategories,
  fetchPublicFeaturedPrompts,
  fetchPublicPrompts
} from "@/lib/api";
import {
  buildCategoryChips,
  buildTrendingTags,
  dedupePrompts,
  isVideoPrompt,
  isVisualPrompt
} from "@/lib/prompt-visuals";
import {
  createPageMetadata,
  DEFAULT_TITLE,
  SITE_DESCRIPTION
} from "@/lib/seo";

export const metadata = createPageMetadata({
  absoluteTitle: DEFAULT_TITLE,
  description: SITE_DESCRIPTION,
  path: "/"
});

export default async function HomePage() {
  const [imageResponse, promptResponse, featuredResponse, categoryResponse] =
    await Promise.all([
      fetchPublicPrompts({ category: "Image Prompts", limit: "30" }).catch(() => ({
        data: [],
        pagination: { total: 0 }
      })),
      fetchPublicPrompts({ limit: "30" }).catch(() => ({
        data: [],
        pagination: { total: 0 }
      })),
      fetchPublicFeaturedPrompts().catch(() => ({
        data: [],
        pagination: { total: 0 }
      })),
      fetchPublicCategories(100).catch(() => [])
    ]);

  const allPrompts = promptResponse.data || [];
  const visualPrompts = dedupePrompts([
    ...(featuredResponse.data || []).filter(isVisualPrompt),
    ...(imageResponse.data || []).filter(isVisualPrompt),
    ...allPrompts.filter(isVisualPrompt)
  ]).filter((prompt) => prompt?.slug);
  const initialPrompts = visualPrompts.slice(0, 30);
  const chips = buildCategoryChips(categoryResponse, visualPrompts, 15, {
    requireDbCategory: true,
    requirePromptMatch: true
  });
  const trendings = buildTrendingTags(visualPrompts, categoryResponse, 5);
  const heroVideos = visualPrompts.filter(isVideoPrompt);
  const initialHasMore = [
    imageResponse.pagination,
    promptResponse.pagination
  ].some((pagination) => Number(pagination?.page || 1) < Number(pagination?.pages || 1));

  return (
    <main className="home-reference-page">
      <HomeVisualFeed
        categories={chips}
        heroVideos={heroVideos.slice(0, 4)}
        initialHasMore={initialHasMore}
        initialPage={1}
        initialPrompts={initialPrompts}
        trendings={trendings}
      />
    </main>
  );
}
