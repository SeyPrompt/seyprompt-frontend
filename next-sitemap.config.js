const siteUrl = "https://seyprompt.com";

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

const categoryPaths = [
  "Marketing",
  "Coding",
  "Business",
  "Resume",
  "Design",
  "Image Prompts",
  "Social Media"
].map((category) => `/prompts?category=${encodeURIComponent(category)}`);

async function getPromptPaths() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${apiBaseUrl}/api/prompts?limit=1000`, {
      signal: controller.signal
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const prompts = Array.isArray(payload)
      ? payload
      : payload.data || payload.prompts || payload.items || payload.results || [];

    return prompts
      .filter((prompt) => prompt?.slug && prompt.status === "published" && prompt.visibility === "public")
      .map((prompt) => `/prompts/${prompt.slug}`);
  } catch (_error) {
    return [];
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
  exclude: ["/admin/*", "/api/*"],
  additionalPaths: async (config) => {
    const promptPaths = await getPromptPaths();
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
    priority: path === "/" ? 1 : path.startsWith("/prompts") ? 0.8 : config.priority,
    lastmod: new Date().toISOString()
  })
};
