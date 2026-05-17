import Link from "next/link";
import Image from "next/image";
import { SocialLinks } from "@/components/SocialLinks";
import { fetchPromptCategories, fetchPromptTools } from "@/lib/api";
import { appVersionLabel } from "@/lib/app-version";
import { getCategoryPath } from "@/lib/seo";

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

export async function Footer() {
  const [categoryItems, toolItems] = await Promise.all([
    fetchPromptCategories(footerCategoryLimit).catch(() => []),
    fetchPromptTools(6).catch(() => [])
  ]);
  const categories = toFooterItems(categoryItems, fallbackCategories, footerCategoryLimit);
  const tools = toFooterItems(toolItems, fallbackTools);

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
              {categories.map((category) => (
                <Link
                  href={getCategoryPath(category)}
                  key={category}
                >
                  {category} Prompts
                </Link>
              ))}
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
          <p>© 2026 SeyPrompt. All rights reserved. | {appVersionLabel} </p>
          <nav className="footer-legal-links" aria-label="Legal links">
            {legalLinks.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <p>Built for creators, developers, and businesses using AI.</p>
        </div>
      </div>
    </footer>
  );
}
