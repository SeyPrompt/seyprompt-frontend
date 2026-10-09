import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Lightbulb } from "lucide-react";
import { fetchPromptBySlug, fetchPublicPrompts } from "@/lib/api";
import { PromptAccessLink } from "@/components/PromptAccessLink";
import { PromptLoginGate } from "@/components/PromptLoginGate";
import { PremiumPromptUnlock } from "@/components/PremiumPromptUnlock";
import { RecordPromptView } from "@/components/record-prompt-view";
import {
  getPrimaryPromptCategory,
  getPromptCategories,
  getPromptCategoryLabel
} from "@/lib/prompt-metadata";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { formatPromptPrice, getPromptPricingType } from "@/lib/prompt-pricing";
import {
  absoluteUrl,
  breadcrumbSchema,
  createPromptMetadata,
  getCategoryPath,
  promptSchema,
  truncateDescription
} from "@/lib/seo";

function descriptionFromPrompt(prompt) {
  const source = prompt.description || prompt.prompt || prompt.title;
  return truncateDescription(source);
}

function getPromptTips(prompt) {
  return String(prompt?.tips || prompt?.notes || "").trim();
}

function getSampleOutputPreview(prompt) {
  const sampleOutput = prompt?.sampleOutput;

  if (sampleOutput?.type === "image") {
    const value =
      sampleOutput.watermarkedPreviewUrl || prompt?.watermarkedPreviewUrl || sampleOutput.value || "";

    return value ? { type: "image", value } : null;
  }

  if (sampleOutput?.type === "video" && sampleOutput.value) {
    return { type: "video", value: sampleOutput.value };
  }

  const fallbackImage = String(prompt?.watermarkedPreviewUrl || prompt?.image || prompt?.thumbnail || "").trim();

  return fallbackImage ? { type: "image", value: fallbackImage } : null;
}

function formatPromptViews(viewsCount) {
  const views = Math.max(Number(viewsCount || 0), 0);

  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(views >= 10000000 ? 0 : 1)}M views`;
  }

  if (views >= 1000) {
    return `${(views / 1000).toFixed(views >= 10000 ? 0 : 1)}K views`;
  }

  return `${views} ${views === 1 ? "view" : "views"}`;
}

function SampleOutputDisplay({ prompt }) {
  const sampleOutput = prompt.sampleOutput;

  if (!sampleOutput) {
    return (
      <div className="sample-empty-state">
        <span>Sample output</span>
        <strong>Preview not added yet</strong>
        <p>The reusable prompt is still available after unlock.</p>
      </div>
    );
  }

  if (typeof sampleOutput === "string") {
    return <div className="prose content-box sample-box">{sampleOutput}</div>;
  }

  if (sampleOutput.type === "text") {
    return <div className="prose content-box sample-box">{sampleOutput.value}</div>;
  }

  if (sampleOutput.type === "image") {
    const previewUrl =
      sampleOutput.watermarkedPreviewUrl || prompt.watermarkedPreviewUrl || sampleOutput.value;

    return (
      <div className="sample-media-box">
        <img
          alt={sampleOutput.fileName || `${prompt.title} sample output`}
          className="sample-output-image"
          src={previewUrl}
        />
      </div>
    );
  }

  if (sampleOutput.type === "video") {
    return (
      <div className="sample-media-box">
        <video className="sample-output-video" controls preload="metadata" src={sampleOutput.value}>
          <a href={sampleOutput.value}>Open video</a>
        </video>
        {sampleOutput.fileName ? <p className="muted">{sampleOutput.fileName}</p> : null}
      </div>
    );
  }

  if (sampleOutput.type === "pdf" || sampleOutput.type === "file") {
    const label = sampleOutput.type === "pdf" ? "Open PDF" : "Open File";

    return (
      <div className="sample-media-box">
        <a
          className="button-secondary"
          href={sampleOutput.value}
          rel="noopener noreferrer"
          target="_blank"
        >
          {label}
        </a>
        {sampleOutput.fileName ? <p className="muted">{sampleOutput.fileName}</p> : null}
      </div>
    );
  }

  return null;
}

async function fetchRelatedPrompts(prompt) {
  const requests = [];
  const primaryCategory = getPrimaryPromptCategory(prompt);

  if (primaryCategory) {
    requests.push(fetchPublicPrompts({ category: primaryCategory, limit: "6" }));
  }

  for (const tool of (prompt.tools || []).slice(0, 2)) {
    requests.push(fetchPublicPrompts({ tool, limit: "6" }));
  }

  const responses = await Promise.all(requests.map((request) => request.catch(() => null)));
  const seen = new Set([prompt.slug, prompt._id, prompt.id].filter(Boolean));
  const related = [];

  for (const response of responses) {
    for (const item of response?.data || []) {
      const key = item.slug || item._id || item.id;

      if (!key || seen.has(key)) {
        continue;
      }

      seen.add(key);
      related.push(item);

      if (related.length >= 4) {
        return related;
      }
    }
  }

  return related;
}

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    const prompt = await fetchPromptBySlug(slug);
    return createPromptMetadata(prompt);
  } catch (_error) {
    return {
      title: "Prompt Not Found",
      robots: {
        index: false,
        follow: false
      }
    };
  }
}

export default async function PromptDetailPage({ params }) {
  const { slug } = await params;
  const prompt = await fetchPromptBySlug(slug).catch(() => null);

  if (!prompt) {
    notFound();
  }

  const categories = getPromptCategories(prompt);
  const primaryCategory = getPrimaryPromptCategory(prompt);
  const CategoryIcon = getCategoryIcon(primaryCategory);
  const relatedPrompts = await fetchRelatedPrompts(prompt);
  const promptTips = getPromptTips(prompt);
  const heroPreview = getSampleOutputPreview(prompt);
  const schemas = [
    promptSchema(prompt),
    breadcrumbSchema([
      { name: "Discover", path: "/" },
      ...(primaryCategory ? [{ name: primaryCategory, path: getCategoryPath(primaryCategory) }] : []),
      { name: prompt.title, path: `/prompts/${prompt.slug}` }
    ])
  ];

  return (
    <main className="prompt-detail-page">
      <PromptLoginGate />
      <RecordPromptView prompt={prompt} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <div className="container prompt-detail-container">
        <article className="prompt-detail-shell">
          <header className="prompt-detail-hero">
            <div className="prompt-detail-hero-copy">
              <Link className="back-link prompt-detail-back" href="/" aria-label="Back to Discover">
                <ArrowLeft size={18} />
                <span>Back to Discover</span>
              </Link>
              <div className="detail-title-row">
                <div className="category-icon prompt-icon" aria-hidden="true">
                  <CategoryIcon size={22} />
                </div>
                <div>
                  <div className="eyebrow">{primaryCategory || "General"}</div>
                </div>
              </div>
              <h1 className="page-title">{prompt.title}</h1>
              {prompt.description ? <p className="page-subtitle">{prompt.description}</p> : null}
              <div className="prompt-detail-meta-row">
                {categories.slice(0, 4).map((category) => (
                  <span className="pill" key={`category-${category}`}>
                    {category}
                  </span>
                ))}
                {(prompt.tools || []).slice(0, 3).map((tool) => (
                  <span className="pill pill-alt" key={tool}>
                    {tool}
                  </span>
                ))}
                <span className="pill pill-alt prompt-views-pill">
                  <Eye size={14} aria-hidden="true" />
                  {formatPromptViews(prompt.viewsCount)}
                </span>
              </div>
            </div>

            <span className={`prompt-hero-price-badge price-badge price-badge-${getPromptPricingType(prompt)}`}>
              {formatPromptPrice(prompt)}
            </span>
            <div className="prompt-hero-preview" aria-label="Prompt sample preview">
              {heroPreview?.type === "image" ? (
                <img alt={`${prompt.title} sample preview`} src={heroPreview.value} />
              ) : heroPreview?.type === "video" ? (
                <video
                  aria-label={`${prompt.title} video preview`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  src={heroPreview.value}
                />
              ) : (
                <div className="prompt-hero-preview-empty">
                  <CategoryIcon size={34} />
                  <span>Preview pending</span>
                </div>
              )}
              <span className="prompt-hero-preview-caption">Copy, adapt, generate</span>
            </div>
          </header>

          <div className="prompt-flow-steps" aria-label="How to use this prompt">
            <span>1. Inspect the sample</span>
            <span>2. Copy the reusable prompt</span>
            <span>3. Open it in your AI tool</span>
          </div>

          <div className="prompt-detail-workspace">
            <section className="prompt-workspace-panel prompt-workspace-sample">
              <div className="prompt-workspace-heading">
                <div>
                  <p className="eyebrow">Sample output</p>
                </div>
              </div>
              <SampleOutputDisplay prompt={prompt} />
            </section>

            <div className="prompt-workspace-side">
              <PremiumPromptUnlock
                description={descriptionFromPrompt(prompt)}
                prompt={prompt}
                shareUrl={absoluteUrl(`/prompts/${prompt.slug}`)}
              />
              {promptTips ? (
                <aside className="prompt-tips-box" aria-label="Prompt tips">
                  <div className="prompt-tips-icon" aria-hidden="true">
                    <Lightbulb size={18} />
                  </div>
                  <div>
                    <h3>Use it better</h3>
                    <div className="prose">{promptTips}</div>
                  </div>
                </aside>
              ) : null}
            </div>
          </div>

          {relatedPrompts.length ? (
            <section className="prompt-related-strip" aria-label="Related prompts">
              <div className="prompt-workspace-heading">
                <div>
                  <p className="eyebrow">Keep exploring</p>
                  <h2>Related prompts</h2>
                </div>
              </div>
              <div className="related-list prompt-related-grid">
                {relatedPrompts.map((relatedPrompt) => (
                  <PromptAccessLink href={`/prompts/${relatedPrompt.slug}`} key={relatedPrompt.slug}>
                    <span>
                      {relatedPrompt.title}
                      <small>
                        {getPromptCategoryLabel(
                          relatedPrompt,
                          (relatedPrompt.tools || [])[0] || "Prompt"
                        )}
                      </small>
                    </span>
                  </PromptAccessLink>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </div>
    </main>
  );
}
