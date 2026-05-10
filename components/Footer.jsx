import Link from "next/link";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/prompts", label: "Prompt Library" },
  { href: "/ai-prompt-guide", label: "AI Prompt Guide" },
  { href: "/ai-tools", label: "AI Tools" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/contact", label: "Contact" },
];

const categories = [
  {
    href: { pathname: "/prompts", query: { category: "Marketing" } },
    label: "Marketing Prompts",
  },
  {
    href: { pathname: "/prompts", query: { category: "Coding" } },
    label: "Coding Prompts",
  },
  {
    href: { pathname: "/prompts", query: { category: "Resume" } },
    label: "Resume Prompts",
  },
  {
    href: { pathname: "/prompts", query: { category: "Business" } },
    label: "Business Prompts",
  },
  {
    href: { pathname: "/prompts", query: { category: "Social Media" } },
    label: "Social Media Prompts",
  },
];

const tools = ["ChatGPT", "Claude", "Midjourney", "Canva"];

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-brand-heading">
              <a href="/" className="navbar-brand">
                <span className="logo-wrap">
                  <img
                    alt="SeyPrompt logo"
                    className="navbar-logo-image"
                    src="/images/seyprompt-logo.png"
                  />
                </span>
              </a>
            </div>
            <p className="footer-tagline">Smart Prompts. Better Results.</p>
            <p>
              Discover, copy, and use the best AI prompts for ChatGPT, Claude,
              and more.
            </p>
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
                <Link href={category.href} key={category.label}>
                  {category.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="footer-column">
            <h3>Tools</h3>
            <nav>
              {tools.map((tool) => (
                <Link
                  href={{ pathname: "/prompts", query: { tag: tool } }}
                  key={tool}
                >
                  {tool}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 SeyPrompt. All rights reserved.</p>
          <p>Built for creators, developers, and businesses using AI.</p>
        </div>
      </div>
    </footer>
  );
}
