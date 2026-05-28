import Link from "next/link";
import Image from "next/image";
import { fetchPublicFeaturedPrompts, fetchPublicPrompts } from "@/lib/api";
import { PromptCard } from "@/components/prompt-card";
import { TrackedLink } from "@/components/tracked-link";
import { TrackedSearchForm } from "@/components/tracked-search-form";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { getPromptCategories, getPrimaryPromptCategory } from "@/lib/prompt-metadata";
import {
  createPageMetadata,
  DEFAULT_TITLE,
  getCategoryPath,
  getPromptImage,
  SITE_DESCRIPTION
} from "@/lib/seo";

export const metadata = createPageMetadata({
  absoluteTitle: DEFAULT_TITLE,
  description: SITE_DESCRIPTION,
  path: "/"
});

function getPromptOutputType(prompt) {
  return String(
    prompt?.outputType ||
      prompt?.output_type ||
      prompt?.sampleOutputType ||
      prompt?.sampleOutput?.type ||
      ""
  ).toLowerCase();
}

function isImagePrompt(prompt) {
  return getPromptOutputType(prompt) === "image";
}

function FeaturedPromptsSection({ prompts }) {
  const featuredPrompts = prompts.slice(0, 4);

  if (!featuredPrompts.length) {
    return null;
  }

  return (
    <section className="section featured-prompts-section">
      <div className="container">
        <div className="featured-prompts-panel">
          <div className="featured-prompts-copy">
            <div className="eyebrow">Handpicked</div>
            <h2>Editor&apos;s Picks</h2>
            <p className="muted">
              A short hand-picked set for fast wins before you browse the full
              library.
            </p>
            <Link className="featured-prompts-link" href="/prompts">
              Browse all prompts
            </Link>
          </div>
          <div className="featured-prompt-grid">
            {featuredPrompts.map((prompt, index) => {
              const categories = getPromptCategories(prompt);
              const primaryCategory = getPrimaryPromptCategory(prompt);
              const CategoryIcon = getCategoryIcon(primaryCategory);
              const description = prompt.description || prompt.prompt || "";
              const featuredLabels = prompt.tags?.length
                ? prompt.tags.slice(0, 1).map((tag) => `#${tag}`)
                : categories.slice(0, 1);
              const tools = prompt.tools || [];

              return (
                <Link
                  className="featured-prompt-card"
                  href={`/prompts/${prompt.slug}`}
                  key={prompt._id || prompt.id || prompt.slug}
                >
                  <span className="featured-prompt-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="featured-prompt-body">
                    <span className="featured-prompt-topline">
                      <span className="featured-prompt-icon" aria-hidden="true">
                        <CategoryIcon size={16} />
                      </span>
                      <span>{primaryCategory || "General"}</span>
                    </span>
                    <strong>{prompt.title}</strong>
                    <span className="muted">
                      {description.slice(0, 86)}
                      {description.length > 86 ? "..." : ""}
                    </span>
                    <span className="featured-prompt-meta">
                      {featuredLabels.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                      {tools[0] ? <span>{tools[0]}</span> : null}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ImagePromptCarousel({ prompts }) {
  if (!prompts.length) {
    return null;
  }

  const carouselPrompts = prompts.length > 1 ? [...prompts, ...prompts] : prompts;

  return (
    <section className="section image-prompts-section">
      <div className="container">
        <div className="section-header">
          <div>
            <div className="eyebrow">Visual ideas</div>
            <h2>Image Prompts</h2>
          </div>
          <Link
            className="button-secondary"
            href={getCategoryPath("Image Prompts")}
          >
            View image prompts
          </Link>
        </div>
        <div className="image-prompt-carousel" aria-label="Image prompt carousel">
          <div className={`image-prompt-track${prompts.length > 1 ? " is-animated" : ""}`}>
            {carouselPrompts.map((prompt, index) => (
              <Link
                className="card image-prompt-card"
                href={`/prompts/${prompt.slug}`}
                key={`${prompt._id || prompt.id || prompt.slug}-${index}`}
                aria-hidden={index >= prompts.length ? "true" : undefined}
                tabIndex={index >= prompts.length ? -1 : undefined}
              >
                <span className="image-prompt-media">
                  <img
                    alt={prompt.sampleOutput?.fileName || `${prompt.title} image prompt`}
                    height="180"
                    loading="lazy"
                    src={getPromptImage(prompt)}
                    width="280"
                  />
                </span>
                <span className="image-prompt-copy">
                  <strong>{prompt.title}</strong>
                  <span className="muted">
                    {(prompt.prompt || "").slice(0, 105)}
                    {(prompt.prompt || "").length > 105 ? "..." : ""}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [promptResponse, featuredPromptResponse] = await Promise.all([
    fetchPublicPrompts({ limit: "24" }).catch(() => ({
      data: [],
      pagination: { total: 0 },
    })),
    fetchPublicFeaturedPrompts().catch(() => ({
      data: [],
      pagination: { total: 0 }
    }))
  ]);

  const allPrompts = promptResponse.data || [];
  const prompts = allPrompts.slice(0, 6);
  const featuredPrompts = featuredPromptResponse.data || [];
  const imagePrompts = allPrompts.filter(isImagePrompt).slice(0, 8);
  const categories = ["Marketing", "Coding", "Resume", "Business", "Design"];
  const steps = [
    {
      icon: "1",
      title: "Find a prompt",
      description:
        "Search by use case, category, tag, or tool to discover the right starting point.",
    },
    {
      icon: "2",
      title: "Copy it",
      description:
        "Grab a polished prompt that is structured, specific, and ready to customize.",
    },
    {
      icon: "3",
      title: "Use in AI",
      description:
        "Paste it into ChatGPT, Claude, Gemini, or your favorite AI workspace.",
    },
  ];
  const tools = [
    {
      name: "ChatGPT",
      logo: "/icons/chatgpt.svg",
      description:
        "Best for writing, ideation, coding help, and everyday productivity.",
    },
    {
      name: "Claude",
      logo: "/icons/claude.svg",
      description:
        "Great for long-form writing, careful reasoning, and document-heavy work.",
    },
    {
      name: "Midjourney",
      logo: "/icons/midjourney.svg",
      description:
        "A strong choice for visual concepts, image prompts, and creative exploration.",
    },
  ];

  return (
    <main>
      <section className="home-hero">
        <div className="container home-hero-inner">
          <div className="home-hero-copy">
            <div className="eyebrow">Prompt operating system</div>
            <h1>Smart Prompts. Better Results.</h1>
            <p>
              Discover, copy, and use high-quality AI prompts built for better
              writing, sharper ideas, faster coding, and clearer daily work.
            </p>
            <TrackedSearchForm className="hero-search" />
            <div
              className="category-pills home-category-pills"
              aria-label="Popular categories"
            >
              {categories.map((category) =>
                (() => {
                  const CategoryIcon = getCategoryIcon(category);

                  return (
                    <Link
                      className="category-pill"
                      href={getCategoryPath(category)}
                      key={category}
                    >
                      <CategoryIcon size={15} />
                      {category}
                    </Link>
                  );
                })(),
              )}
            </div>
            <div className="home-hero-actions">
              <TrackedLink
                className="button"
                eventParams={{
                  event_category: "CTA",
                  event_label: "Browse Prompts",
                  cta_name: "home_browse_prompts"
                }}
                href="/prompts"
              >
                Browse Prompts
              </TrackedLink>
              <TrackedLink
                className="button-secondary"
                eventParams={{
                  event_category: "CTA",
                  event_label: "Learn Guide",
                  cta_name: "home_learn_guide"
                }}
                href="/ai-prompt-guide"
              >
                Learn Guide
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      <FeaturedPromptsSection prompts={featuredPrompts} />

      <section className="section">
        <div className="container home-stack">
          <div className="home-section-heading">
            <h2>How It Works</h2>
            <p className="muted">
              SeyPrompt keeps prompt discovery simple: find the right prompt,
              copy it, and use it wherever you already work with AI.
            </p>
          </div>
          <div className="home-info-grid">
            {steps.map((step) => (
              <article className="card home-info-card" key={step.title}>
                <div className="home-info-icon" aria-hidden="true">
                  {step.icon}
                </div>
                <h3>{step.title}</h3>
                <p className="muted">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="eyebrow">Popular picks</div>
              <h2>Trending Prompts</h2>
            </div>
            <Link className="button-secondary" href="/prompts">
              View all prompts
            </Link>
          </div>
          {prompts.length ? (
            <div className="grid prompt-grid">
              {prompts.map((prompt) => (
                <PromptCard
                  key={prompt._id || prompt.id || prompt.slug}
                  prompt={prompt}
                />
              ))}
            </div>
          ) : (
            <div className="panel empty-state">
              <h3>No published prompts yet</h3>
              <p className="muted">
                Once prompts are published from the admin panel, they will
                appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      <ImagePromptCarousel prompts={imagePrompts} />

      <section className="section home-soft-section">
        <div className="container home-stack">
          <div className="home-section-heading">
            <h2>Works With Popular AI Tools</h2>

            <p className="muted">
              Use SeyPrompt examples across leading AI platforms and creative
              tools.
            </p>
          </div>

          <div className="home-tool-grid">
            {tools.map((tool) => (
              <article className="card home-tool-card" key={tool.name}>
                <div className="home-tool-mark" aria-hidden="true">
                  {tool.logo ? (
                    <Image
                      src={tool.logo}
                      alt={tool.name}
                      className="home-tool-logo"
                      height={36}
                      loading="lazy"
                      width={36}
                    />
                  ) : (
                    tool.name.slice(0, 1)
                  )}
                </div>

                <h3>{tool.name}</h3>

                <p className="muted">{tool.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
