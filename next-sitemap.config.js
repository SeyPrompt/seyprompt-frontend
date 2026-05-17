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
  "/terms-of-use"
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
        return item.startsWith("/") ? item : `/prompts/${item}`;
      }

      const path = item?.path || item?.url;
      const slug = item?.slug;

      if (path) {
        return pathFromUrl(path);
      }

      return slug ? `/prompts/${slug}` : "";
    })
    .filter((path) => path.startsWith("/prompts/"));

  const categoryPaths = categoryItems
    .map((item) => {
      if (typeof item === "string") {
        return item.startsWith("/") ? item : `/categories/${slugify(item)}`;
      }

      const path = item?.path || item?.url;
      const slug = item?.slug || item?.categorySlug;
      const name = item?.name || item?.label || item?.title || item?.category;

      if (path) {
        return pathFromUrl(path);
      }

      return slug || name ? `/categories/${slug || slugify(name)}` : "";
    })
    .filter((path) => path.startsWith("/categories/"));

  return {
    promptPaths: [...new Set(promptPaths)],
    categoryPaths: [...new Set(categoryPaths)]
  };
}

async function getPublicSitemapPaths() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${apiBaseUrl}/api/public/sitemap-data`, {
      signal: controller.signal
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    return normalizeSitemapData(payload);
  } catch (_error) {
    return {
      promptPaths: [],
      categoryPaths: fallbackCategories.map((category) => `/categories/${slugify(category)}`)
    };
  } finally {
    clearTimeout(timeout);
  }
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
    "/profile",
    "/profile/*",
    "/saved",
    "/saved-prompts"
  ],
  additionalPaths: async (config) => {
    const { promptPaths, categoryPaths } = await getPublicSitemapPaths();
    const paths = [...staticPaths, ...categoryPaths, ...promptPaths];

    return Promise.all(
      paths.map((path) =>
        config.transform(config, path)
      )
    );
  },
  transform: async (config, path) => ({
    loc: path,
    changefreq: path.startsWith("/prompts/") ? "monthly" : config.changefreq,
    priority: path === "/" ? 1 : path.startsWith("/prompts") || path.startsWith("/categories") ? 0.8 : config.priority,
    lastmod: new Date().toISOString()
  })
};
