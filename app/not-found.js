import Link from "next/link";
import { Home, Library, LifeBuoy, Search } from "lucide-react";

export const metadata = {
  title: "Page Not Found | SeyPrompt",
  description:
    "The page you are looking for could not be found. Browse SeyPrompt prompts, read the prompt guide, or contact support.",
  robots: {
    index: false,
    follow: false
  }
};

const helpfulLinks = [
  {
    href: "/prompts",
    icon: Library,
    title: "Prompt Library",
    description: "Browse ready-to-use prompts by category, tag, and AI tool."
  },
  {
    href: "/ai-prompt-guide",
    icon: Search,
    title: "Prompt Guide",
    description: "Learn how to write clearer prompts for better AI results."
  },
  {
    href: "/contact",
    icon: LifeBuoy,
    title: "Contact",
    description: "Ask for custom prompts or help finding the right workflow."
  }
];

export default function NotFound() {
  return (
    <main>
      <section className="not-found-hero">
        <div className="container not-found-inner">
          <div className="not-found-code">404</div>
          <div className="eyebrow">Page not found</div>
          <h1>This prompt path did not land anywhere</h1>
          <p>
            The page may have moved, the link may be old, or the URL may have a
            typo. You can head back home or jump into the main SeyPrompt
            library.
          </p>
          <div className="not-found-actions">
            <Link className="button" href="/">
              <Home size={18} aria-hidden="true" />
              Back Home
            </Link>
            <Link className="button-secondary" href="/prompts">
              Browse Prompts
            </Link>
          </div>
        </div>
      </section>

      <section className="section not-found-section">
        <div className="container not-found-grid">
          {helpfulLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link className="card not-found-card" href={item.href} key={item.href}>
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
      </section>
    </main>
  );
}
