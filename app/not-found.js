import Link from "next/link";
import { BriefcaseBusiness, Code2, Home, Library, Megaphone, Palette } from "lucide-react";

export const metadata = {
  title: "Page Not Found",
  description:
    "The page you are looking for could not be found. Browse SeyPrompt prompts, read the prompt guide, or contact support.",
  robots: {
    index: false,
    follow: false
  }
};

const helpfulLinks = [
  {
    href: { pathname: "/prompts", query: { category: "Marketing" } },
    icon: Megaphone,
    title: "Marketing",
    description: "Campaign, content, SEO, and growth prompts."
  },
  {
    href: { pathname: "/prompts", query: { category: "Coding" } },
    icon: Code2,
    title: "Coding",
    description: "Debugging, refactoring, testing, and build prompts."
  },
  {
    href: { pathname: "/prompts", query: { category: "Business" } },
    icon: BriefcaseBusiness,
    title: "Business",
    description: "Strategy, operations, sales, and planning prompts."
  },
  {
    href: { pathname: "/prompts", query: { category: "Design" } },
    icon: Palette,
    title: "Design",
    description: "Visual, brand, and creative production prompts."
  }
];

export default function NotFound() {
  return (
    <main>
      <section className="not-found-hero">
        <div className="container not-found-inner">
          <div className="not-found-code">404</div>
          <div className="eyebrow">Page not found</div>
          <h1>Prompt not found, but better prompts are waiting.</h1>
          <p>
            The page may have moved, the link may be old, or the URL may have a
            typo. You can head back home or jump into the main SeyPrompt
            library.
          </p>
          <div className="not-found-actions">
            <Link className="button" href="/">
              <Home size={18} aria-hidden="true" />
              Go Home
            </Link>
            <Link className="button-secondary" href="/prompts">
              <Library size={18} aria-hidden="true" />
              Browse Prompt Library
            </Link>
          </div>
        </div>
      </section>

      <section className="section not-found-section">
        <div className="container stack">
          <div className="section-header not-found-categories-header">
            <div>
              <div className="eyebrow">Popular categories</div>
              <h2>Find your next useful prompt</h2>
            </div>
          </div>
          <div className="not-found-grid">
            {helpfulLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link className="card not-found-card" href={item.href} key={item.title}>
                  <span className="not-found-card-icon" aria-hidden="true">
                    <Icon size={23} strokeWidth={2.2} />
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <span className="muted">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
