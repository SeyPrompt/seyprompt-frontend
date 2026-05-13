export const SITE_URL = "https://www.seyprompt.com";
export const SITE_NAME = "SeyPrompt";
export const SITE_TAGLINE = "Smart Prompts. Better Results.";
export const SITE_DESCRIPTION =
  "Discover ready-made AI prompts for ChatGPT, Claude, Gemini, Midjourney, and more. Better Prompts. Better Results.";
export const DEFAULT_OG_IMAGE = "/og-image.png";
export const DEFAULT_OG_IMAGE_URL = `${SITE_URL}${DEFAULT_OG_IMAGE}`;

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

export function truncateDescription(value = "", maxLength = 155) {
  const normalized = String(value).replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

export function getPromptImage(prompt) {
  const sampleOutput = prompt?.sampleOutput;

  if (sampleOutput && typeof sampleOutput === "object" && sampleOutput.type === "image") {
    return sampleOutput.value;
  }

  return prompt?.image || prompt?.coverImage || prompt?.thumbnail || DEFAULT_OG_IMAGE_URL;
}

export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE_URL,
  type = "website",
  keywords = SEO_KEYWORDS
}) {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: title ? `${title} | ${SITE_NAME}` : SITE_NAME,
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
      card: "summary_large_image",
      title: title ? `${title} | ${SITE_NAME}` : SITE_NAME,
      description,
      images: [imageUrl],
      creator: "@seyprompt"
    }
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

export function promptSchema(prompt) {
  const url = absoluteUrl(`/prompts/${prompt.slug}`);
  const description = truncateDescription(
    prompt.description || prompt.prompt || prompt.title
  );
  const image = absoluteUrl(getPromptImage(prompt));

  return {
    "@context": "https://schema.org",
    "@type": ["CreativeWork", "Article"],
    headline: prompt.title,
    name: prompt.title,
    description,
    url,
    image,
    genre: prompt.category || "AI Prompts",
    keywords: [...(prompt.tags || []), ...(prompt.tools || [])].join(", "),
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
