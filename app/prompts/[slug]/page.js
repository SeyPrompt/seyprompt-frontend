import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { fetchPromptBySlug, fetchPromptMetadataBySlug, fetchPublicPrompts } from "@/lib/api";
import { PromptAccessLink } from "@/components/PromptAccessLink";
import { PromptLoginGate } from "@/components/PromptLoginGate";
import { PremiumPromptUnlock } from "@/components/PremiumPromptUnlock";
import { PromptDetailPriceBadge } from "@/components/prompt-detail-price-badge";
import { ProtectedImage, ProtectedMediaFrame, ProtectedVideo } from "@/components/protected-media";
import { RecordPromptView } from "@/components/record-prompt-view";
import { SavedPromptButton } from "@/components/saved-prompt-button";
import {
  getPrimaryPromptCategory,
  getPromptCategories,
  getPromptCategoryLabel
} from "@/lib/prompt-metadata";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { getPromptPricingType } from "@/lib/prompt-pricing";
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
      <ProtectedMediaFrame className="sample-media-box">
        <ProtectedImage
          alt={sampleOutput.fileName || `${prompt.title} sample output`}
          className="sample-output-image"
          fetchPriority="high"
          height={900}
          loading="eager"
          sizes="(max-width: 760px) 100vw, (max-width: 1180px) 62vw, 900px"
          src={previewUrl}
          width={1200}
          widths={[480, 720, 960, 1200, 1440]}
        />
      </ProtectedMediaFrame>
    );
  }

  if (sampleOutput.type === "video") {
    const previewUrl =
      sampleOutput.watermarkedPreviewUrl || prompt.watermarkedPreviewUrl || sampleOutput.value;

    return (
      <ProtectedMediaFrame className="sample-media-box">
        <ProtectedVideo className="sample-output-video" controls preload="metadata" src={previewUrl} />
      </ProtectedMediaFrame>
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
    const prompt = await fetchPromptMetadataBySlug(slug);
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
  const isPremium = getPromptPricingType(prompt) === "premium";
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
                <SavedPromptButton className="prompt-detail-save" prompt={prompt} />
              </div>
            </div>

            <div className="prompt-hero-visual">
              <PromptDetailPriceBadge prompt={prompt} />
            </div>
          </header>

          {!isPremium ? (
            <div className="prompt-flow-steps" aria-label="How to use this prompt">
              <span>1. Inspect the sample</span>
              <span>2. Copy the reusable prompt</span>
              <span>3. Open it in your AI tool</span>
            </div>
          ) : null}

          <div className={`prompt-detail-workspace${isPremium ? " prompt-detail-workspace-premium" : ""}`}>
            {!isPremium ? (
              <section className="prompt-workspace-panel prompt-workspace-sample">
                <div className="prompt-workspace-heading">
                  <div>
                    <p className="eyebrow">Sample output</p>
                  </div>
                </div>
                <SampleOutputDisplay prompt={prompt} />
              </section>
            ) : null}

            <div className="prompt-workspace-side">
              {!isPremium && promptTips ? (
                <aside className="prompt-tips-box" aria-labelledby="prompt-tips-heading">
                  <div className="prompt-tips-icon" aria-hidden="true">
                    <Lightbulb size={18} />
                  </div>
                  <div>
                    <h3 id="prompt-tips-heading">Tips</h3>
                    <div className="prose">{promptTips}</div>
                  </div>
                </aside>
              ) : null}
              <PremiumPromptUnlock
                description={descriptionFromPrompt(prompt)}
                prompt={prompt}
                shareUrl={absoluteUrl(`/prompts/${prompt.slug}`)}
              />
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
