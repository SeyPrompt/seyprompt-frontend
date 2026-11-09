"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalListingBadges } from "./external-listing";
import { SampleCollage, GalleryLightbox } from "./sample-image-gallery";
import { getSampleImages, getCoverIndex } from "@/lib/sample-images";
import { ArrowLeft, ArrowRight, ArrowUp, CalendarDays, ChevronDown, X } from "lucide-react";
import { PromptAccessLink } from "@/components/PromptAccessLink";
import { useAccountAccess } from "@/components/account-access-provider";
import { ProtectedImage, ProtectedVideo } from "@/components/protected-media";
import { SavedPromptButton } from "@/components/saved-prompt-button";
import { formatPromptPriceParts, getPromptPricingType } from "@/lib/prompt-pricing";
import { dedupePrompts, getPromptImageSource, getPromptVideoSource } from "@/lib/prompt-visuals";
import { categoryImage } from "@/lib/discovery-categories";
import { apiUrl } from "@/utils/api";

function formatPromptCreatedDate(prompt) {
  const date = new Date(prompt.createdAt || prompt.publishedAt || prompt.updatedAt);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit", timeZone: "Asia/Kolkata" }).format(date);
}

export function VisualPromptCard({ isUnlocked = false, prompt, index, fallbackImage }) {
  const images = getSampleImages(prompt);
  const hasGallery = images.length > 1;
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(() => getCoverIndex(prompt, images));
  const closeGallery = useRef(() => setGalleryOpen(false)).current;
  const title = prompt?.title || "Untitled prompt";
  const previewImage = getPromptImageSource(prompt) || fallbackImage;
  const videoSource = getPromptVideoSource(prompt);
  const createdDate = formatPromptCreatedDate(prompt);
  const pricingType = getPromptPricingType(prompt);
  const displayPrice = formatPromptPriceParts(prompt);
  const isExternal = prompt.listingType === "external";
  const DetailLink = isExternal ? Link : PromptAccessLink;

  return (
    <article className={`home-reference-card home-reference-card-${index % 6}${videoSource ? " has-video" : ""}${hasGallery ? " has-gallery" : ""}`}>
      <DetailLink
        className="home-reference-card-link"
        href={`/prompts/${prompt.slug}`}
        onClick={hasGallery && !isExternal ? event => { event.preventDefault(); setGalleryIndex(getCoverIndex(prompt, images)); setGalleryOpen(true); } : undefined}
      >
        {hasGallery ? <SampleCollage prompt={prompt} /> : videoSource ? (
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
            sizes="(max-width: 599px) 50vw, (max-width: 999px) 33vw, 25vw"
            src={previewImage}
            width={640}
            widths={[320, 480, 640, 800]}
          />
        )}
        <span className="home-reference-card-shade" aria-hidden="true" />
        {isExternal ? <ExternalListingBadges listing={prompt} overlay /> : <span className={`price-badge home-reference-price-badge price-badge-${pricingType}${isUnlocked && pricingType === "premium" ? " price-badge-owned" : ""}`}>
          <span>
            <span className="price-badge-amount">{displayPrice.label}</span>
            {displayPrice.suffix ? <small>{displayPrice.suffix}</small> : null}
          </span>
        </span>}
        <span className="home-reference-card-copy">
          <span className="home-reference-card-title">{title} ›</span>
          {createdDate ? (
            <span className="home-reference-card-meta">
              <CalendarDays size={12} aria-hidden="true" />
              {createdDate}
            </span>
          ) : null}
        </span>
      </DetailLink>
      {!isExternal && <SavedPromptButton className="home-reference-save" iconOnly prompt={prompt} />}
      {hasGallery && !isExternal ? <GalleryLightbox prompt={prompt} images={images} index={galleryIndex} setIndex={setGalleryIndex} open={galleryOpen} onClose={closeGallery} showPromptLink /> : null}
    </article>
  );
}

export default function HomeVisualFeed({ categories = [], collection, initialCategory = "", initialQuery = "", initialPricing = "", legacyCategory = "", tool = "", tag = "", initialPrompts = [], initialHasMore = false, initialLoadFailed = false }) {
  const { isPromptUnlocked } = useAccountAccess();
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState("");
  const [search, setSearch] = useState(initialQuery);
  const [pricing, setPricing] = useState(initialPricing);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [prompts, setPrompts] = useState(initialPrompts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialLoadFailed ? "Prompts are temporarily unavailable. Please try again." : "");
  const [retry, setRetry] = useState(0);
  const [columns, setColumns] = useState(4);
  const [showTop, setShowTop] = useState(false);
  const rail = useRef(null);
  const sentinel = useRef(null);
  const selected = categories.find(row => row.slug === category);
  const children = selected?.children || [];
  const title = collection?.name || selected?.name || "All prompts";
  const categoryFilter = category ? "" : legacyCategory;
  const activeKey = JSON.stringify([category, subcategory, search, pricing, sort, collection?.slug || "", categoryFilter, tool, tag]);
  const initialKey = JSON.stringify([initialCategory, "", initialQuery, initialPricing, "newest", collection?.slug || "", legacyCategory, tool, tag]);
  const initialData = useRef({ key: initialKey, prompts: initialPrompts, hasMore: initialHasMore, failed: initialLoadFailed });
  const previousKey = useRef(activeKey);

  useEffect(() => {
    initialData.current = { key: initialKey, prompts: initialPrompts, hasMore: initialHasMore, failed: initialLoadFailed };
    setCategory(initialCategory); setSubcategory(""); setSearch(initialQuery); setPricing(initialPricing); setSort("newest"); setPage(1);
    setPrompts(initialPrompts); setHasMore(initialHasMore); setError(initialLoadFailed ? "Prompts are temporarily unavailable. Please try again." : "");
  }, [initialKey, initialPrompts, initialHasMore, initialLoadFailed, initialCategory, initialQuery, initialPricing]);

  useEffect(() => {
    const syncColumns = () => setColumns(window.innerWidth < 600 ? 2 : window.innerWidth < 1000 ? 3 : 4);
    const syncScroll = () => setShowTop(window.scrollY > 600);
    syncColumns(); syncScroll();
    window.addEventListener("resize", syncColumns);
    window.addEventListener("scroll", syncScroll, { passive: true });
    return () => { window.removeEventListener("resize", syncColumns); window.removeEventListener("scroll", syncScroll); };
  }, []);

  useEffect(() => {
    if (previousKey.current !== activeKey) { previousKey.current = activeKey; if (page !== 1) { setPage(1); return; } }
    if (page === 1 && activeKey === initialData.current.key && !retry) {
      setPrompts(initialData.current.prompts); setHasMore(initialData.current.hasMore); setLoading(false);
      setError(initialData.current.failed ? "Prompts are temporarily unavailable. Please try again." : ""); return;
    }
    const controller = new AbortController();
    setLoading(true); setError("");
    if (page === 1) setPrompts([]);
    const params = new URLSearchParams({ limit: "30", page: String(page), discoverSort: sort });
    if (collection) params.set("discoverCollection", collection.slug);
    else if (category) params.set("discoverCategory", category);
    if (categoryFilter) params.set("category", categoryFilter);
    if (tool) params.set("tool", tool);
    if (tag) params.set("tag", tag);
    if (subcategory) params.set("discoverSubcategory", subcategory);
    if (search) params.set("q", search);
    if (pricing) params.set("pricing", pricing);
    fetch(apiUrl(`/api/public/prompts?${params}`), { cache: "no-store", signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(result => {
        if (controller.signal.aborted) return;
        const rows = (result.data || []).filter(row => row.slug);
        setPrompts(current => page === 1 ? rows : dedupePrompts([...current, ...rows]));
        setHasMore(Number(result.pagination?.page || page) < Number(result.pagination?.pages || 1));
      })
      .catch(() => { if (!controller.signal.aborted) setError("Could not load prompts. Please try again."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [activeKey, page, retry, category, subcategory, search, pricing, sort, collection, categoryFilter, tool, tag]);

  useEffect(() => {
    if (!hasMore || loading || error || !sentinel.current) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setPage(current => current + 1); }, { rootMargin: "400px" });
    observer.observe(sentinel.current); return () => observer.disconnect();
  }, [hasMore, loading, error]);

  const promptColumns = useMemo(() => {
    const result = Array.from({ length: columns }, () => []);
    prompts.forEach((prompt, index) => result[index % columns].push({ prompt, index })); return result;
  }, [prompts, columns]);

  function selectCategory(slug) { setCategory(slug); setSubcategory(""); }
  function clearFilters() { setSearch(""); setPricing(""); setSubcategory(""); }

  return <>
    <section className="home-reference-hero discover-hero">
      <div className="container home-reference-hero-inner">
        <div className="home-reference-hero-copy">
          <h1>See the result. Copy the prompt.<span>Create your version.</span></h1>
          <p>Explore AI prompts for photos, design, business, learning, coding and more.</p>
          <div className="home-reference-trending"><span>Trending:</span>{["halloween", "diwali", "family photo", "product ad", "youtube script", "logo design"].map(term => <button type="button" className={search === term ? "active" : ""} key={term} onClick={() => { setCategory(""); setSubcategory(""); setSearch(term); }}>{term}</button>)}</div>
        </div>
        <div className="discover-hero-art" aria-hidden="true">
          {["personal-lifestyle", "products-ecommerce", "design-creativity", "coding-technology", "content-media"].map((slug, index) => <div className={`discover-hero-tile tile-${index}`} key={slug}><Image src={`/images/categories/${slug}.webp`} alt="" fill sizes="180px" priority /></div>)}
          <span className="discover-hero-note">Turn ideas into<br />reality with AI <span>⤵</span></span>
        </div>
      </div>
    </section>
    <section className="container discover-categories" id="categories" aria-labelledby="category-title">
      <div className="discover-section-heading"><div><h2 id="category-title">Explore by Category</h2><p>Choose what you want to create</p></div><div className="discover-rail-controls"><button type="button" aria-label="Previous categories" onClick={() => rail.current?.scrollBy({ left: -500, behavior: "smooth" })}><ArrowLeft size={19} /></button><button type="button" aria-label="Next categories" onClick={() => rail.current?.scrollBy({ left: 500, behavior: "smooth" })}><ArrowRight size={19} /></button></div></div>
      <div className="discover-category-rail" ref={rail}>
        {categories.map(row => <button type="button" className={`discover-category-card${category === row.slug && !collection ? " selected" : ""}`} key={row.id || row.slug} aria-pressed={category === row.slug && !collection} onClick={() => { if (collection) window.location.assign(`/?category=${row.slug}`); else selectCategory(row.slug); }}><span className="discover-category-image"><img src={categoryImage(row)} alt="" loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/images/categories/personal-lifestyle.webp"; }} /></span><span>{row.name}</span></button>)}
      </div>
    </section>
    <section className="home-reference-library discover-library">
      <div className="container home-reference-library-inner">
        <div className="discover-filter-heading">
          <div className="discover-category-description"><h2>{title}</h2><p>{collection?.description || selected?.description}</p></div>
          <div className="discover-selects">
            <label className="home-reference-sort"><span>Price</span><span className="home-reference-sort-control"><select aria-label="Price" value={pricing} onChange={event => setPricing(event.target.value)}><option value="">All prices</option><option value="free">Free</option><option value="premium">Premium</option></select><ChevronDown size={14} /></span></label>
            <label className="home-reference-sort"><span>Sort by</span><span className="home-reference-sort-control"><select aria-label="Sort by" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="title">A–Z</option></select><ChevronDown size={14} /></span></label>
          </div>
        </div>
        <div className="discover-subcategories" aria-label="Subcategories">
          <button type="button" className={`home-reference-chip${!subcategory ? " active" : ""}`} aria-pressed={!subcategory} onClick={() => setSubcategory("")}>All</button>
          {children.slice(0, 6).map(child => <button type="button" className={`home-reference-chip${subcategory === child.slug ? " active" : ""}`} aria-pressed={subcategory === child.slug} key={child.slug} onClick={() => setSubcategory(child.slug)}>{child.name}</button>)}
          {children.length > 6 && <label className="discover-more"><span className="visually-hidden">More subcategories</span><select value={children.slice(6).some(child => child.slug === subcategory) ? subcategory : ""} onChange={event => setSubcategory(event.target.value)}><option value="" disabled>More</option>{children.slice(6).map(child => <option key={child.slug} value={child.slug}>{child.name}</option>)}</select><ChevronDown size={14} /></label>}
          {(search || pricing || subcategory) && <button className="discover-clear" type="button" onClick={clearFilters}><X size={13} />Clear filters</button>}
        </div>
        <section className="home-reference-feed" aria-label="Prompt results" aria-busy={loading}>

          {search && <p className="discover-search-summary" role="status">Results for “{search}”</p>}
          {prompts.length > 0 && <div className="home-reference-grid">{promptColumns.map((column, index) => <div className="home-reference-column" key={index}>{column.map(({ prompt, index }) => <VisualPromptCard key={prompt.id || prompt._id || prompt.slug} prompt={prompt} index={index} fallbackImage={selected ? categoryImage(selected) : "/images/hero-bg-data-flow.png"} isUnlocked={isPromptUnlocked(prompt)} />)}</div>)}</div>}
          {!prompts.length && !loading && !error && <div className="panel empty-state"><h3>No prompts found</h3><p>Try another subcategory or a different search.</p><button type="button" className="button-secondary" onClick={clearFilters}>Clear filters</button></div>}
          <div className="home-reference-load-state" ref={sentinel} aria-live="polite">{loading && <span>Loading prompts…</span>}{error && <div><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Try again</button></div>}{!hasMore && !loading && !error && prompts.length > 0 && <span>You’re all caught up. Explore another category.</span>}</div>
        </section>
      </div>
    </section>
    <button type="button" className={`home-back-to-top${showTop ? " visible" : ""}`} aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={19} /></button>
  </>;
}
