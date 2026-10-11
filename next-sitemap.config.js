const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.SITE_URL ||
  "https://www.seyprompt.com"
).replace(/\/$/, "");

const staticPaths = [
  "/",
  "/prompts",
  "/ai-prompt-guide",
  "/ai-tools",
  "/use-cases",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-use",
  "/refund-policy",
  "/shipping-policy"
];

const fallbackCategories = [
  "Marketing",
  "Coding",
  "Business",
  "Resume",
  "Design",
  "Image Prompts",
  "Social Media"
];

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstList(...values) {
  return values.find((value) => Array.isArray(value) && value.length) || [];
}

function pathFromUrl(value) {
  if (!value) {
    return "";
  }

  const stringValue = String(value);

  if (stringValue.startsWith("/")) {
    return stringValue;
  }

  try {
    return new URL(stringValue, siteUrl).pathname;
  } catch {
    return "";
  }
}

function uniqueSitemapItems(items) {
  const seen = new Set();
  const unique = [];

  for (const item of items) {
    if (!item.path || seen.has(item.path)) {
      continue;
    }

    seen.add(item.path);
    unique.push(item);
  }

  return unique;
}

function normalizeSitemapData(payload) {
  const data = payload?.data || payload || {};
  const rootList = Array.isArray(payload) ? payload : [];
  const promptItems = firstList(
    rootList,
    toArray(data.prompts),
    toArray(data.promptSlugs),
    toArray(data.promptUrls),
    toArray(data.items),
    toArray(data.results)
  );
  const categoryItems = firstList(
    toArray(data.categories),
    toArray(data.categorySlugs),
    toArray(data.categoryUrls)
  );

  const promptPaths = promptItems
    .map((item) => {
      if (typeof item === "string") {
        return {
          path: item.startsWith("/") ? item : `/prompts/${item}`,
          updatedAt: ""
        };
      }

      const path = item?.path || item?.url;
      const slug = item?.slug;
      const resolvedPath = path ? pathFromUrl(path) : slug ? `/prompts/${slug}` : "";

      return {
        path: resolvedPath,
        updatedAt: item?.updatedAt || item?.lastmod || item?.lastModified || ""
      };
    })
    .filter((item) => item.path.startsWith("/prompts/"));

  const categoryPaths = categoryItems
    .map((item) => {
      if (typeof item === "string") {
        return {
          path: item.startsWith("/") ? item : `/categories/${slugify(item)}`,
          updatedAt: ""
        };
      }

      const path = item?.path || item?.url;
      const slug = item?.slug || item?.categorySlug;
      const name = item?.name || item?.label || item?.title || item?.category;
      const resolvedPath = path ? pathFromUrl(path) : slug || name ? `/categories/${slug || slugify(name)}` : "";

      return {
        path: resolvedPath,
        updatedAt: item?.updatedAt || item?.lastmod || item?.lastModified || ""
      };
    })
    .filter((item) => item.path.startsWith("/categories/"));

  return {
    promptPaths: uniqueSitemapItems(promptPaths),
    categoryPaths: uniqueSitemapItems(categoryPaths)
  };
}

let publicSitemapPathsPromise;

async function getPublicSitemapPaths() {
  if (publicSitemapPathsPromise) {
    return publicSitemapPathsPromise;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || siteUrl;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  publicSitemapPathsPromise = (async () => {
    const response = await fetch(`${apiBaseUrl}/api/public/sitemap-data`, {
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        promptPaths: [],
        categoryPaths: fallbackCategories.map((category) => ({
          path: `/categories/${slugify(category)}`,
          updatedAt: ""
        }))
      };
    }

    const payload = await response.json();
    return normalizeSitemapData(payload);
  })().catch((_error) => ({
    promptPaths: [],
    categoryPaths: fallbackCategories.map((category) => ({
      path: `/categories/${slugify(category)}`,
      updatedAt: ""
    }))
  })).finally(() => {
    clearTimeout(timeout);
  });

  return publicSitemapPathsPromise;
}

async function getSitemapLastModifiedByPath() {
  const { promptPaths, categoryPaths } = await getPublicSitemapPaths();

  return new Map([
    ...promptPaths.map((item) => [item.path, item.updatedAt]),
    ...categoryPaths.map((item) => [item.path, item.updatedAt])
  ]);
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,
  generateRobotsTxt: false,
  sitemapSize: 5000,
  changefreq: "weekly",
  priority: 0.7,
  exclude: [
    "/admin",
    "/admin/*",
    "/api/*",
    "/login",
    "/login/*",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/dashboard",
    "/dashboard/*",
    "/orders",
    "/orders/*",
    "/profile",
    "/profile/*",
    "/saved",
    "/saved/*",
    "/saved-prompts",
    "/unlocked-prompts",
    "/unlocked-prompts/*"
  ],
  additionalPaths: async (config) => {
    const { promptPaths, categoryPaths } = await getPublicSitemapPaths();
    const paths = [...staticPaths, ...categoryPaths, ...promptPaths].map((item) =>
      typeof item === "string" ? item : item.path
    );

    return Promise.all(
      paths.map((path) =>
        config.transform(config, path)
      )
    );
  },
  transform: async (config, path) => {
    const lastModifiedByPath = await getSitemapLastModifiedByPath();

    return {
      loc: path,
      changefreq: path.startsWith("/prompts/") ? "monthly" : config.changefreq,
      priority:
        path === "/"
          ? 1
          : path.startsWith("/prompts") || path.startsWith("/categories")
            ? 0.8
            : config.priority,
      lastmod: lastModifiedByPath.get(path) || new Date().toISOString()
    };
  }
};
