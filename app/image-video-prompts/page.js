import Link from "next/link";
import { SavedPromptButton } from "@/components/saved-prompt-button";
import { VisualPromptActions } from "@/components/VisualPromptActions";
import { fetchPromptBySlug, fetchPublicPrompts } from "@/lib/api";
import { absoluteUrl, createPageMetadata, getPromptImage } from "@/lib/seo";
import { getPromptCategories } from "@/lib/prompt-metadata";

const visualCategories = [
  { key: "image", label: "Image", category: "Image Prompts" },
  { key: "video", label: "Video", category: "Video Prompts" }
];

export const metadata = createPageMetadata({
  title: "Image and Video Prompts",
  description:
    "Browse AI image and video prompts with visual previews, then open any prompt for the full detail and copy-ready workflow.",
  path: "/image-video-prompts",
  keywords: [
    "AI image prompts",
    "AI video prompts",
    "Midjourney prompts",
    "Runway prompts",
    "visual AI prompts",
    "SeyPrompt"
  ]
});

function getPromptOutputType(prompt) {
  return String(
    prompt?.outputType ||
      prompt?.output_type ||
      prompt?.sampleOutputType ||
      prompt?.sampleOutput?.type ||
      ""
  )
    .trim()
    .toLowerCase();
}

function getDescription(prompt) {
  return prompt.description || prompt.prompt || "";
}

function getPromptText(prompt) {
  return prompt.prompt || prompt.content || prompt.text || prompt.description || "";
}

function dedupePrompts(prompts = []) {
  const seen = new Set();
  const uniquePrompts = [];

  for (const prompt of prompts) {
    const key = prompt?.slug || prompt?._id || prompt?.id || prompt?.title;

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniquePrompts.push(prompt);
  }

  return uniquePrompts;
}

function promptMatchesVisualType(prompt, type) {
  const outputType = getPromptOutputType(prompt);
  const categories = getPromptCategories(prompt).map((category) => category.toLowerCase());

  if (type === "video") {
    return outputType === "video" || categories.some((category) => category.includes("video"));
  }

  return outputType === "image" || categories.some((category) => category.includes("image"));
}

async function hydratePromptDetails(prompts = []) {
  return Promise.all(
    prompts.map(async (prompt) => {
      if (!prompt?.slug) {
        return prompt;
      }

      try {
        const fullPrompt = await fetchPromptBySlug(prompt.slug);

        return {
          ...prompt,
          ...fullPrompt,
          sampleOutput: fullPrompt.sampleOutput || prompt.sampleOutput
        };
      } catch (_error) {
        return prompt;
      }
    })
  );
}

function VisualPromptCard({ prompt, visualType }) {
  const description = getDescription(prompt);
  const promptText = getPromptText(prompt);
  const previewImage = getPromptImage(prompt);
  const sampleOutput = prompt.sampleOutput || {};
  const canRenderVideo = visualType === "video" && sampleOutput.type === "video" && sampleOutput.value;
  const detailPath = `/prompts/${prompt.slug}`;

  return (
    <article className="visual-prompt-card">
      <Link className="visual-prompt-card-link" href={detailPath} aria-label={`View ${prompt.title}`}>
        {canRenderVideo ? (
          <video
            muted
            playsInline
            preload="metadata"
            poster={previewImage}
            src={sampleOutput.value}
          />
        ) : (
          <img
            alt={sampleOutput.fileName || `${prompt.title} preview`}
            loading="lazy"
            src={previewImage}
          />
        )}
        <span className="visual-prompt-copy">
          <strong>{prompt.title}</strong>
          <span>
            {description.slice(0, 118)}
            {description.length > 118 ? "..." : ""}
          </span>
        </span>
      </Link>
      <VisualPromptActions
        description={description}
        promptText={promptText}
        shareUrl={absoluteUrl(detailPath)}
        title={prompt.title}
      />
      <SavedPromptButton className="visual-prompt-save" iconOnly prompt={prompt} />
    </article>
  );
}

function VisualPromptTabs({ activeTab, promptsByType }) {
  return (
    <div className="visual-prompts-tabs" aria-label="Visual prompt categories" role="tablist">
      {visualCategories.map((category) => (
        <Link
          aria-selected={activeTab === category.key}
          className={`visual-prompts-tab${activeTab === category.key ? " active" : ""}`}
          href={
            category.key === "image"
              ? "/image-video-prompts"
              : "/image-video-prompts?tab=video"
          }
          key={category.key}
          role="tab"
        >
          <span>{category.label}</span>
          <strong>{promptsByType[category.key].length}</strong>
        </Link>
      ))}
    </div>
  );
}

function VisualPromptToolbar({ activeTab, promptsByType }) {
  return (
    <div className="visual-prompt-toolbar">
      <VisualPromptTabs activeTab={activeTab} promptsByType={promptsByType} />
    </div>
  );
}

function VisualPromptSection({ category, prompts }) {
  return (
    <section className="visual-category-section" id={`${category.key}-prompts`}>
      {prompts.length ? (
        <div className="visual-prompt-grid">
          {prompts.map((prompt) => (
            <VisualPromptCard
              key={prompt._id || prompt.id || prompt.slug}
              prompt={prompt}
              visualType={category.key}
            />
          ))}
        </div>
      ) : (
        <div className="panel empty-state visual-category-empty">
          <h3>No {category.label.toLowerCase()} prompts found yet.</h3>
          <p className="muted">
            Published prompts in the {category.category} category will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

export default async function ImageVideoPromptsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams?.tab === "video" ? "video" : "image";
  const responses = await Promise.all(
    visualCategories.map((category) =>
      fetchPublicPrompts({ category: category.category, limit: "100" }).catch(() => ({
        data: [],
        loadFailed: true,
        pagination: { total: 0 }
      }))
    )
  );
  const loadFailed = responses.every((response) => response.loadFailed);
  const promptsByType = Object.fromEntries(
    visualCategories.map((category, index) => {
      const categoryPrompts = responses[index]?.data || [];
      const matchingPrompts = categoryPrompts.filter((prompt) =>
        promptMatchesVisualType(prompt, category.key)
      );

      return [category.key, dedupePrompts(matchingPrompts.length ? matchingPrompts : categoryPrompts)];
    })
  );
  const totalPrompts = promptsByType.image.length + promptsByType.video.length;
  const activeCategory = visualCategories.find((category) => category.key === activeTab);
  const activePrompts = promptsByType[activeTab];
  const hydratedActivePrompts = await hydratePromptDetails(activePrompts);

  return (
    <main className="section visual-prompts-page">
      <div className="container stack">
        <section className="visual-prompts-hero">
          <div className="eyebrow">Visual ideas</div>
          <h1 className="page-title">Image and Video Prompts</h1>
          <p className="page-subtitle">
            Browse visual AI prompts with preview media, then open the detail page
            for the full prompt, tools, tips, and sample output.
          </p>
        </section>
        <VisualPromptToolbar activeTab={activeTab} promptsByType={promptsByType} />

        {totalPrompts ? (
          <VisualPromptSection category={activeCategory} prompts={hydratedActivePrompts} />
        ) : (
          <div className="panel empty-state prompt-empty-state">
            <h3>
              {loadFailed
                ? "We could not load visual prompts."
                : "No image or video prompts found yet."}
            </h3>
            <p className="muted">
              {loadFailed
                ? "The catalog may be temporarily unavailable. Try again from the main prompt library."
                : "Visual prompts will appear here once published prompts are added to Image Prompts or Video Prompts."}
            </p>
            <div className="empty-state-actions">
              <Link className="button" href="/prompts">
                Browse Prompt Library
              </Link>
              <Link className="button-secondary" href="/contact">
                Request a Prompt
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
