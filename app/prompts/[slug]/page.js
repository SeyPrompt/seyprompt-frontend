import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchPromptBySlug, fetchPromptMetadataBySlug, fetchPublicPrompts } from "@/lib/api";
import { PromptAccessLink } from "@/components/PromptAccessLink";
import { PromptLoginGate } from "@/components/PromptLoginGate";
import { PremiumPromptUnlock } from "@/components/PremiumPromptUnlock";
import { PromptDetailPriceBadge } from "@/components/prompt-detail-price-badge";
import { PromptSamplePanel, PromptTips } from "@/components/prompt-detail-sections";
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

          {isPremium ? (
            <PremiumPromptUnlock
              description={descriptionFromPrompt(prompt)}
              includeDetails
              prompt={prompt}
              shareUrl={absoluteUrl(`/prompts/${prompt.slug}`)}
            />
          ) : (
            <div className="prompt-detail-workspace">
              <PromptSamplePanel prompt={prompt} />
              <div className="prompt-workspace-side">
                <PromptTips prompt={prompt} />
                <PremiumPromptUnlock
                  description={descriptionFromPrompt(prompt)}
                  prompt={prompt}
                  shareUrl={absoluteUrl(`/prompts/${prompt.slug}`)}
                />
              </div>
            </div>
          )}

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
