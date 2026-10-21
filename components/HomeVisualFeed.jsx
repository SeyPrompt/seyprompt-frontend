"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, CalendarDays, ChevronDown, Search, X } from "lucide-react";
import { PromptAccessLink } from "@/components/PromptAccessLink";
import { useAccountAccess } from "@/components/account-access-provider";
import { ProtectedImage, ProtectedVideo } from "@/components/protected-media";
import { SavedPromptButton } from "@/components/saved-prompt-button";
import { formatPromptPriceParts, getPromptPricingType } from "@/lib/prompt-pricing";
import {
  dedupePrompts,
  getPromptImageSource,
  getPromptVideoSource,
  isVideoPrompt,
  isVisualPrompt,
  normalizeText
} from "@/lib/prompt-visuals";
import { apiUrl } from "@/utils/api";

const pageSize = 30;

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "A-Z", value: "title" },
  { label: "Videos First", value: "video" }
];

const pricingOptions = [
  { label: "All prices", value: "" },
  { label: "Free", value: "free" },
  { label: "Premium", value: "premium" }
];

const heroBackgrounds = [
  "/images/hero-bg-green-forms.png",
  "/images/hero-bg-data-flow.png",
  "/images/hero-bg-glass-structure.png"
];

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePromptList(response) {
  if (Array.isArray(response)) {
    return {
      data: response,
      pagination: { total: response.length, page: 1, pages: 1 }
    };
  }

  const data =
    response?.data ||
    response?.prompts ||
    response?.items ||
    response?.results ||
    [];

  return {
    ...response,
    data: toArray(data),
    pagination: response?.pagination || {
      total: toArray(data).length,
      page: Number(response?.page || 1),
      pages: Number(response?.pages || 1)
    }
  };
}

function promptTime(prompt, field) {
  const value = prompt?.[field];
  const time = value ? new Date(value).getTime() : 0;

  return Number.isFinite(time) ? time : 0;
}

function formatPromptCreatedDate(prompt) {
  const value = prompt?.createdAt || prompt?.created_at || prompt?.publishedAt || prompt?.updatedAt;
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit"
  }).format(date);
}

function sortVisualPrompts(prompts, sortBy) {
  return [...prompts].sort((a, b) => {
    if (sortBy === "oldest") {
      return promptTime(a, "createdAt") - promptTime(b, "createdAt");
    }

    if (sortBy === "title") {
      return String(a?.title || "").localeCompare(String(b?.title || ""));
    }

    if (sortBy === "video") {
      return Number(isVideoPrompt(b)) - Number(isVideoPrompt(a)) || promptTime(b, "createdAt") - promptTime(a, "createdAt");
    }

    return promptTime(b, "createdAt") - promptTime(a, "createdAt");
  });
}

function getReferenceColumnCount() {
  if (typeof window === "undefined") {
    return 4;
  }

  if (window.innerWidth <= 860) {
    return 2;
  }

  if (window.innerWidth <= 1180) {
    return 3;
  }

  return 4;
}

function createPromptColumns(prompts, columnCount) {
  const columns = Array.from({ length: columnCount }, () => []);

  prompts.forEach((prompt, index) => {
    columns[index % columnCount].push({ prompt, index });
  });

  return columns;
}

async function fetchPromptPage(source, page, filters) {
  const params = new URLSearchParams({
    limit: String(pageSize),
    page: String(page)
  });

  if (source.category) {
    params.set("category", source.category);
  }

  if (filters.query) {
    params.set("q", filters.query);
  }

  if (filters.tag) {
    params.set("tag", filters.tag);
  }

  if (filters.pricing) {
    params.set("pricing", filters.pricing);
  }

  const response = await fetch(apiUrl(`/api/public/prompts?${params.toString()}`), {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to load prompts.");
  }

  return normalizePromptList(await response.json());
}

function VisualPromptCard({ isUnlocked = false, prompt, index }) {
  const title = prompt?.title || "Untitled prompt";
  const previewImage = getPromptImageSource(prompt);
  const videoSource = getPromptVideoSource(prompt);
  const createdDate = formatPromptCreatedDate(prompt);
  const pricingType = getPromptPricingType(prompt);
  const displayPrice = formatPromptPriceParts(prompt);

  return (
    <article className={`home-reference-card home-reference-card-${index % 6}${videoSource ? " has-video" : ""}`}>
      <PromptAccessLink
        className="home-reference-card-link"
        href={`/prompts/${prompt.slug}`}
      >
        {videoSource ? (
          <ProtectedVideo
            autoPlay
            loop
            muted
            playsInline
            poster={previewImage}
            posterOptions={{ crop: "fill" }}
            posterWidth={480}
            preload={index < 8 ? "auto" : "metadata"}
            src={videoSource}
          />
        ) : (
          <ProtectedImage
            alt={prompt?.sampleOutput?.fileName || `${title} preview`}
            fetchPriority={index < 4 ? "high" : "auto"}
            height={720}
            loading={index < 8 ? "eager" : "lazy"}
            sizes="(max-width: 560px) 100vw, (max-width: 860px) 50vw, (max-width: 1180px) 33vw, 25vw"
            src={previewImage}
            width={640}
            widths={[320, 480, 640, 800]}
          />
        )}
        <span className="home-reference-card-shade" aria-hidden="true" />
        <span className={`price-badge home-reference-price-badge price-badge-${pricingType}${isUnlocked && pricingType === "premium" ? " price-badge-owned" : ""}`}>
          <span>
            <span className="price-badge-amount">{displayPrice.label}</span>
            {displayPrice.suffix ? <small>{displayPrice.suffix}</small> : null}
          </span>
        </span>
        <span className="home-reference-card-copy">
          <span className="home-reference-card-title">{title} ›</span>
          {createdDate ? (
            <span className="home-reference-card-meta">
              <CalendarDays size={12} aria-hidden="true" />
              {createdDate}
            </span>
          ) : null}
        </span>
      </PromptAccessLink>
      <SavedPromptButton className="home-reference-save" iconOnly prompt={prompt} />
    </article>
  );
}

function HeroVideoRail({ videos = [] }) {
  const playableVideos = videos
    .map((prompt) => ({
      image: getPromptImageSource(prompt),
      slug: prompt?.slug,
      title: prompt?.title || "Video prompt",
      video: getPromptVideoSource(prompt)
    }))
    .filter((prompt) => prompt.slug && prompt.video)
    .slice(0, 4);

  if (!playableVideos.length) {
    return null;
  }

  return (
    <div className="home-reference-video-rail" aria-label="Featured video prompts">
      {playableVideos.map((prompt, index) => (
        <PromptAccessLink
          className={`home-reference-hero-video home-reference-hero-video-${index}`}
          href={`/prompts/${prompt.slug}`}
          key={prompt.slug}
        >
          <ProtectedVideo
            autoPlay
            loop
            muted
            playsInline
            poster={prompt.image}
            posterOptions={{ crop: "fill" }}
            posterWidth={360}
            preload={index < 2 ? "auto" : "metadata"}
            src={prompt.video}
          />
          <span>{prompt.title}</span>
        </PromptAccessLink>
      ))}
    </div>
  );
}

export default function HomeVisualFeed({
  categories = [],
  heroVideos = [],
  initialHasMore = true,
  initialPage = 1,
  initialPrompts = [],
  trendings = []
}) {
  const { isPromptUnlocked } = useAccountAccess();
  const initialVisualPrompts = useMemo(
    () => dedupePrompts(initialPrompts).filter(isVisualPrompt),
    [initialPrompts]
  );
  const [prompts, setPrompts] = useState(initialVisualPrompts);
  const [heroVideoPrompts, setHeroVideoPrompts] = useState(() =>
    dedupePrompts(heroVideos).filter((prompt) => getPromptVideoSource(prompt))
  );
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [searchValue, setSearchValue] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [activePricing, setActivePricing] = useState("");
  const [heroBackground, setHeroBackground] = useState("");
  const [columnCount, setColumnCount] = useState(4);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const sentinelRef = useRef(null);
  const activeFilters = useMemo(
    () => ({
      category: normalizeText(activeCategory),
      query: normalizeText(submittedQuery),
      tag: normalizeText(activeTag),
      pricing: normalizeText(activePricing)
    }),
    [activeCategory, activeTag, activePricing, submittedQuery]
  );
  const filterKey = `${activeFilters.category}|${activeFilters.query}|${activeFilters.tag}|${activeFilters.pricing}`;
  const hasActiveFilter = Boolean(activeFilters.category || activeFilters.query || activeFilters.tag || activeFilters.pricing);

  const displayPrompts = useMemo(
    () => sortVisualPrompts(prompts, sortBy),
    [prompts, sortBy]
  );
  const promptColumns = useMemo(
    () => createPromptColumns(displayPrompts, columnCount),
    [columnCount, displayPrompts]
  );

  useEffect(() => {
    const nextIndex = Math.floor(Math.random() * heroBackgrounds.length);
    setHeroBackground(heroBackgrounds[nextIndex]);
  }, []);

  useEffect(() => {
    function syncColumnCount() {
      setColumnCount(getReferenceColumnCount());
    }

    syncColumnCount();
    window.addEventListener("resize", syncColumnCount);

    return () => window.removeEventListener("resize", syncColumnCount);
  }, []);

  useEffect(() => {
    function syncBackToTop() {
      setShowBackToTop(window.scrollY > 560);
    }

    syncBackToTop();
    window.addEventListener("scroll", syncBackToTop, { passive: true });

    return () => window.removeEventListener("scroll", syncBackToTop);
  }, []);

  useEffect(() => {
    if (heroVideoPrompts.length >= 3) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadHeroVideos() {
      try {
        const responses = await Promise.allSettled(
          [1, 2, 3, 4, 5, 6, 7].map((pageNumber) =>
            fetch(apiUrl(`/api/public/prompts?limit=${pageSize}&page=${pageNumber}`), {
              cache: "no-store",
              signal: controller.signal
            }).then((response) => {
              if (!response.ok) {
                throw new Error("Unable to load hero videos.");
              }

              return response.json();
            })
          )
        );
        const discoveredVideos = dedupePrompts(
          responses
            .flatMap((result) => (result.status === "fulfilled" ? normalizePromptList(result.value).data : []))
            .filter((prompt) => prompt?.slug && getPromptVideoSource(prompt))
        ).slice(0, 4);

        if (discoveredVideos.length > heroVideoPrompts.length) {
          setHeroVideoPrompts(discoveredVideos);
        }
      } catch (_error) {
        // A slow video rail should not block the visual prompt grid.
      }
    }

    loadHeroVideos();

    return () => controller.abort();
  }, [heroVideoPrompts.length]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSubmittedQuery(searchValue);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchValue]);

  async function loadPromptPage(targetPage, filters, replace = false) {
    setIsLoading(true);
    setError("");

    try {
      const sources = filters.category
        ? [{ category: filters.category }]
        : [{}];
      const responses = await Promise.all(
        sources.map((source) => fetchPromptPage(source, targetPage, filters).catch(() => null))
      );
      const nextPrompts = dedupePrompts(
        responses.flatMap((response) => response?.data || [])
      ).filter((prompt) => prompt?.slug && isVisualPrompt(prompt));
      const stillHasMore = responses.some((response) => {
        const pagination = response?.pagination || {};

        return Number(pagination.page || targetPage) < Number(pagination.pages || 1);
      });

      setPrompts((currentPrompts) =>
        replace ? nextPrompts : dedupePrompts([...currentPrompts, ...nextPrompts])
      );
      setHasMore(stillHasMore);
    } catch (_err) {
      setError("Could not load prompts.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!hasMore || isLoading) {
      return undefined;
    }

    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage((currentPage) => currentPage + 1);
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  useEffect(() => {
    if (!hasActiveFilter) {
      setPrompts(initialVisualPrompts);
      setHasMore(initialHasMore);
      setPage(initialPage);
      return;
    }

    setPage(initialPage);
    loadPromptPage(initialPage, activeFilters, true);
  }, [filterKey]);

  useEffect(() => {
    if (page <= initialPage) {
      return;
    }

    let cancelled = false;

    async function loadNextPage() {
      setIsLoading(true);
      setError("");

      try {
        const sources = activeFilters.category
          ? [{ category: activeFilters.category }]
          : [{}];
        const responses = await Promise.all(
          sources.map((source) => fetchPromptPage(source, page, activeFilters).catch(() => null))
        );
        const nextPrompts = dedupePrompts(
          responses.flatMap((response) => response?.data || [])
        ).filter((prompt) => prompt?.slug && isVisualPrompt(prompt));
        const stillHasMore = responses.some((response) => {
          const pagination = response?.pagination || {};

          return Number(pagination.page || page) < Number(pagination.pages || 1);
        });

        if (!cancelled) {
          setPrompts((currentPrompts) => dedupePrompts([...currentPrompts, ...nextPrompts]));
          setHasMore(stillHasMore);
        }
      } catch (_err) {
        if (!cancelled) {
          setError("Could not load more prompts.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadNextPage();

    return () => {
      cancelled = true;
    };
  }, [filterKey, initialPage, page, retryCount]);

  function submitSearch(event) {
    event.preventDefault();
    setSubmittedQuery(searchValue);
  }

  function clearFilters() {
    setSearchValue("");
    setSubmittedQuery("");
    setActiveCategory("");
    setActiveTag("");
    setActivePricing("");
  }

  return (
    <>
      <section
        className="home-reference-hero"
        style={heroBackground ? { "--hero-bg-image": `url(${heroBackground})` } : undefined}
      >
        <div className="container home-reference-hero-inner">
          <div className="home-reference-hero-copy">
            <p className="home-reference-eyebrow">The visual prompt library</p>
            <h1>
              See the result. Copy the prompt.
              <span>Create your version.</span>
            </h1>
            <p>
              Explore real AI generations with ready-to-use image and video prompts.
            </p>
            <div className="home-reference-search-panel">
              <form className="home-reference-search" onSubmit={submitSearch}>
                <Search size={20} aria-hidden="true" />
                <label className="visually-hidden" htmlFor="home-reference-search">
                  Search prompts
                </label>
                <input
                  id="home-reference-search"
                  name="q"
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search images and videos..."
                  type="search"
                  value={searchValue}
                />
                <button type="submit">Search</button>
              </form>
              {trendings.length ? (
                <div className="home-reference-trending" aria-label="Trending searches">
                  <span>Trending:</span>
                  {trendings.map((tag) => (
                    <button
                      className={activeTag === tag ? "active" : ""}
                      key={tag}
                      onClick={() => setActiveTag((currentTag) => (currentTag === tag ? "" : tag))}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <HeroVideoRail videos={heroVideoPrompts} />
        </div>
      </section>

      <section className="home-reference-library">
        <div className="container home-reference-library-inner">
          <section className="home-reference-feed" aria-label="Visual prompt feed">
            <div className="home-reference-filter-row">
              <button
                className={`home-reference-clear${hasActiveFilter ? " active" : ""}`}
                onClick={clearFilters}
                type="button"
              >
                {hasActiveFilter ? (
                  <>
                    <X size={14} aria-hidden="true" />
                    Clear filters
                  </>
                ) : (
                  "All visuals"
                )}
              </button>

              {categories.length ? (
                <nav className="home-reference-chip-rail" aria-label="Prompt categories">
                  {categories.map((chip) => (
                    <button
                      className={`home-reference-chip${activeCategory === chip.label ? " active" : ""}`}
                      key={chip.label}
                      onClick={() => setActiveCategory((category) => (category === chip.label ? "" : chip.label))}
                      type="button"
                    >
                      {chip.label}
                    </button>
                  ))}
                </nav>
              ) : null}

              <label className="home-reference-sort home-reference-pricing-filter">
                <span>Price</span>
                <span className="home-reference-sort-control">
                  <select value={activePricing} onChange={(event) => setActivePricing(event.target.value)}>
                    {pricingOptions.map((option) => (
                      <option key={option.value || "all"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </span>
              </label>

              <label className="home-reference-sort">
                <span>Sort by</span>
                <span className="home-reference-sort-control">
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </span>
              </label>
            </div>

            {displayPrompts.length ? (
              <div className="home-reference-grid">
                {promptColumns.map((column, columnIndex) => (
                  <div className="home-reference-column" key={`reference-column-${columnIndex}`}>
                    {column.map(({ prompt, index }) => (
                      <VisualPromptCard
                        index={index}
                        isUnlocked={isPromptUnlocked(prompt)}
                        key={prompt._id || prompt.id || prompt.slug}
                        prompt={prompt}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel empty-state">
                <h3>No visual prompts found yet</h3>
                <p className="muted">
                  Add published prompts with visual, image, or video output to show them here.
                </p>
              </div>
            )}

            <div className="home-reference-load-state" ref={sentinelRef}>
              {isLoading ? <span>Loading visuals...</span> : null}
              {error ? <button type="button" onClick={() => setRetryCount((count) => count + 1)}>{error} Try again</button> : null}
              {!hasMore && displayPrompts.length ? <span>You are caught up.</span> : null}
            </div>
          </section>

          <div id="home-reference-feed-end" />
        </div>
      </section>
      <button
        aria-label="Back to top"
        className={`home-back-to-top${showBackToTop ? " visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        type="button"
      >
        <ArrowUp size={19} aria-hidden="true" />
      </button>
    </>
  );
}
