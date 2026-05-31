import Link from "next/link";
import Image from "next/image";
import { SocialLinks } from "@/components/SocialLinks";
import { fetchPromptCategories, fetchPromptTools } from "@/lib/api";
import { appVersionLabel } from "@/lib/app-version";
import { getCategoryPath } from "@/lib/seo";
import { apiUrl } from "@/utils/api";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/prompts", label: "Prompt Library" },
  { href: "/ai-prompt-guide", label: "AI Prompt Guide" },
  { href: "/ai-tools", label: "AI Tools" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const footerCategoryLimit = 8;

const fallbackCategories = [
  "Marketing",
  "Coding",
  "Resume",
  "Business",
  "Social Media",
  "Design",
  "Image Prompts",
  "Productivity"
];
const fallbackTools = ["ChatGPT", "Claude", "Midjourney", "Canva", "Gemini", "Perplexity"];

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-use", label: "Terms of Use" },
];

function toFooterItems(items, fallbackItems, limit = 6) {
  const uniqueItems = Array.from(new Set([...items, ...fallbackItems]));
  return uniqueItems.slice(0, limit);
}

function formatFooterCategoryLabel(category) {
  const label = String(category || "")
    .trim()
    .replace(/\bprompts\s+prompts$/i, "Prompts");

  if (!label) {
    return "";
  }

  return /\bprompts$/i.test(label) ? label : `${label} Prompts`;
}

function normalizeVersionLabel(version) {
  if (!version) return "unknown";
  const raw = String(version).trim();
  return raw.toLowerCase().startsWith("v") ? raw : `v${raw}`;
}

async function fetchBackendVersion() {
  try {
    const response = await fetch(apiUrl("/api/version"), {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.version || null;
  } catch (_error) {
    return null;
  }
}

export async function Footer() {
  const [categoryItems, toolItems] = await Promise.all([
    fetchPromptCategories(footerCategoryLimit).catch(() => []),
    fetchPromptTools(6).catch(() => [])
  ]);
  const categories = toFooterItems(categoryItems, fallbackCategories, footerCategoryLimit);
  const tools = toFooterItems(toolItems, fallbackTools);
  const backendVersionLabel = normalizeVersionLabel(await fetchBackendVersion());

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-brand-heading">
              <a href="/" className="navbar-brand">
                <span className="logo-wrap">
                  <Image
                    alt="SeyPrompt logo"
                    className="navbar-logo-image"
                    height={42}
                    src="/images/seyprompt-logo.png"
                    width={135}
                  />
                </span>
              </a>
            </div>
            <p className="footer-tagline">Smart Prompts. Better Results.</p>
            <p>
              Discover, copy, and use the best AI prompts for ChatGPT, Claude,
              and more.
            </p>
            <SocialLinks className="footer-social-links" />
          </div>

          <div className="footer-column">
            <h3>Quick Links</h3>
            <nav>
              {quickLinks.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="footer-column">
            <h3>Categories</h3>
            <nav>
              {categories.map((category) => {
                const label = formatFooterCategoryLabel(category);

                return (
                  <Link
                    href={getCategoryPath(category)}
                    key={category}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="footer-column">
            <h3>Tools</h3>
            <nav>
              {tools.map((tool) => (
                <Link
                  href={{ pathname: "/prompts", query: { tool } }}
                  key={tool}
                >
                  {tool}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © 2026 SeyPrompt. All rights reserved.
          </p>
          <nav className="footer-legal-links" aria-label="Legal links">
            {legalLinks.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <p>Built for creators, developers, and businesses using AI.</p>
          <p>UI - {appVersionLabel} | API - {backendVersionLabel}</p>
        </div>
      </div>
    </footer>
  );
}
