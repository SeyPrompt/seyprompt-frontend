import { jsonLd } from '@/lib/taxonomy-seo';
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalListingAction, ExternalListingBadges } from "@/components/external-listing";
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
    requests.push(fetchPublicPrompts({ category: prompt.taxonomy?.primary?.slug || primaryCategory, limit: "6" }));
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
  const isExternal = prompt.listingType === "external";
  const isPremium = !isExternal && getPromptPricingType(prompt) === "premium";
  const schemas = [
    ...(!isExternal ? [promptSchema(prompt)] : []),
    breadcrumbSchema([
      { name: "Discover", path: "/" },
      ...(prompt.taxonomy?.primary ? [...(prompt.taxonomy.primary.parent ? [{ name: prompt.taxonomy.primary.parent.name, path: prompt.taxonomy.primary.parent.path }] : []), { name: prompt.taxonomy.primary.name, path: prompt.taxonomy.primary.path }] : primaryCategory ? [{ name: primaryCategory, path: getCategoryPath(primaryCategory) }] : []),
      { name: prompt.title, path: `/prompts/${prompt.slug}` }
    ])
  ];

  return (
    <main className="prompt-detail-page">
      <RecordPromptView prompt={prompt} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schemas) }}
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
                {prompt.taxonomy ? prompt.taxonomy.categories.map(c => <Link className="pill" key={c.id} href={c.path}>{c.name}</Link>) : categories.slice(0, 4).map(category => <span className="pill" key={category}>{category}</span>)}
                {(prompt.taxonomy?.tags || []).map(tag => <Link className="pill" key={tag.id} href={tag.path}>#{tag.name}</Link>)}
                {(prompt.taxonomy?.collections || []).map(collection => <Link className="pill pill-alt" key={collection.id} href={collection.path}>{collection.name}</Link>)}
                {(prompt.tools || []).slice(0, 3).map((tool) => (
                  <span className="pill pill-alt" key={tool}>
                    {tool}
                  </span>
                ))}
                {isExternal ? (prompt.license && <span className="pill">{prompt.license} license</span>) : <SavedPromptButton className="prompt-detail-save" prompt={prompt} />}
              </div>
            </div>

            <div className="prompt-hero-visual">
              {isExternal ? <ExternalListingBadges listing={prompt} /> : <PromptDetailPriceBadge prompt={prompt} />}
            </div>
          </header>

          {isExternal ? (
            <div className="prompt-detail-workspace">
              {prompt.sampleOutput || prompt.sampleImages?.length ? <PromptSamplePanel prompt={prompt} label="Preview" /> : null}
              <div className="prompt-workspace-side">
                <ExternalListingAction listing={prompt} />
                <PromptTips prompt={prompt} />
              </div>
            </div>
          ) : <PromptLoginGate>
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

          </PromptLoginGate>}
          {relatedPrompts.length ? (
            <section className="prompt-related-strip" aria-label="Related prompts">
              <div className="prompt-workspace-heading">
                <div>
                  <p className="eyebrow">Keep exploring</p>
                  <h2>Related prompts</h2>
                </div>
              </div>
              <div className="related-list prompt-related-grid">
                {relatedPrompts.map((relatedPrompt) => {
                  const RelatedLink = relatedPrompt.listingType === "external" ? Link : PromptAccessLink;
                  return <RelatedLink href={`/prompts/${relatedPrompt.slug}`} key={relatedPrompt.slug}>
                    <span>
                      {relatedPrompt.title}
                      <small>
                        {getPromptCategoryLabel(
                          relatedPrompt,
                          (relatedPrompt.tools || [])[0] || "Prompt"
                        )}
                      </small>
                    </span>
                  </RelatedLink>;
                })}
              </div>
            </section>
          ) : null}
        </article>
      </div>
    </main>
  );
}
