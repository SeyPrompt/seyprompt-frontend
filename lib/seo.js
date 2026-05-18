import { getPromptCategories, getPrimaryPromptCategory } from "@/lib/prompt-metadata";

const FALLBACK_SITE_URL = "https://www.seyprompt.com";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.SITE_URL ||
  FALLBACK_SITE_URL
).replace(/\/$/, "");
export const SITE_NAME = "SeyPrompt";
export const SITE_TAGLINE = "Better Prompts. Better Results.";
export const DEFAULT_TITLE = `${SITE_NAME} - ${SITE_TAGLINE}`;
export const SITE_DESCRIPTION =
  "Discover ready-made AI prompts for ChatGPT, Claude, Midjourney, Gemini and other AI tools to get better outputs instantly.";
export const DEFAULT_OG_IMAGE = "/og-cover.jpg";
export const DEFAULT_OG_IMAGE_URL = `${SITE_URL}${DEFAULT_OG_IMAGE}`;
export const TWITTER_CARD_TYPE = "summary_large_image";

export const PROMPT_CATEGORIES = [
  "Marketing",
  "Coding",
  "Business",
  "Resume",
  "Design",
  "Image Prompts",
  "Social Media"
];

export const SEO_KEYWORDS = [
  "AI prompts",
  "ChatGPT prompts",
  "Midjourney prompts",
  "Claude prompts",
  "AI tools",
  "prompt engineering",
  "AI image prompts"
];

export function absoluteUrl(path = "/") {
  if (!path) {
    return SITE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function slugifyCategory(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryBySlug(categorySlug = "") {
  const normalizedSlug = slugifyCategory(categorySlug);
  return PROMPT_CATEGORIES.find((category) => slugifyCategory(category) === normalizedSlug) || "";
}

export function getCategoryPath(category) {
  return `/categories/${slugifyCategory(category)}`;
}

export function truncateDescription(value = "", maxLength = 155) {
  const normalized = String(value).replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function brandedTitle(title) {
  return title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
}

export function getPromptImage(prompt) {
  return prompt?.image || prompt?.thumbnail || DEFAULT_OG_IMAGE_URL;
}

export function createPageMetadata({
  title,
  absoluteTitle = "",
  description = SITE_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE_URL,
  type = "website",
  keywords = SEO_KEYWORDS
}) {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const fullTitle = absoluteTitle || brandedTitle(title);

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    keywords,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - ${SITE_TAGLINE}`
        }
      ],
      locale: "en_US",
      type
    },
    twitter: {
      card: TWITTER_CARD_TYPE,
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: "@seyprompt"
    }
  };
}

export function createNoIndexMetadata(title = "SeyPrompt") {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false
      }
    }
  };
}

export function createCategoryMetadata(category, categorySlug = "") {
  return createPageMetadata({
    title: `${category} AI Prompts`,
    description: `Explore ready-made ${category} AI prompts for ChatGPT, Claude, Gemini, Midjourney and other AI tools.`,
    path: categorySlug ? `/categories/${categorySlug}` : getCategoryPath(category)
  });
}

export function createPromptMetadata(prompt) {
  const description = truncateDescription(prompt.description || SITE_DESCRIPTION);

  return createPageMetadata({
    title: prompt.title,
    description,
    path: `/prompts/${prompt.slug}`,
    image: getPromptImage(prompt),
    type: "article",
    keywords: [
      ...(prompt.tags || []),
      ...getPromptCategories(prompt),
      ...(prompt.tools || []),
      "AI prompts",
      "prompt engineering"
    ].filter(Boolean)
  });
}

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/android-chrome-512x512.png"),
    sameAs: [
      "https://www.instagram.com/seyprompt",
      "https://www.pinterest.com/seyprompt",
      "https://twitter.com/seyprompt",
      "https://www.linkedin.com/company/seyprompt/"
    ]
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/prompts?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function categorySchema(category, categorySlug = "") {
  const path = categorySlug ? `/categories/${categorySlug}` : getCategoryPath(category);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category} AI Prompts`,
    description: `Explore ready-made ${category} AI prompts for ChatGPT, Claude, Gemini, Midjourney and other AI tools.`,
    url: absoluteUrl(path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL
    }
  };
}

export function promptSchema(prompt) {
  const url = absoluteUrl(`/prompts/${prompt.slug}`);
  const description = truncateDescription(prompt.description || SITE_DESCRIPTION);
  const image = absoluteUrl(getPromptImage(prompt));

  return {
    "@context": "https://schema.org",
    "@type": ["CreativeWork", "Article"],
    headline: prompt.title,
    name: prompt.title,
    description,
    url,
    image,
    genre: getPrimaryPromptCategory(prompt) || "AI Prompts",
    keywords: [
      ...(prompt.tags || []),
      ...getPromptCategories(prompt),
      ...(prompt.tools || [])
    ].join(", "),
    datePublished: prompt.createdAt,
    dateModified: prompt.updatedAt || prompt.createdAt,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/android-chrome-512x512.png")
      }
    }
  };
}
