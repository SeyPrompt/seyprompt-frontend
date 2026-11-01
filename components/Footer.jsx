import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SocialLinks } from "@/components/SocialLinks";
import { fetchPublicDiscovery } from "@/lib/api";
import { discoveryCategories } from "@/lib/discovery-categories";
import { PARENT_COMPANY_URL } from "@/lib/seo";
import { LEGAL_OPERATOR_DISPLAY, policyLinks } from "@/lib/policy-info";

const exploreLinks = [
  { href: "/", label: "Discover" },
  { href: "/prompts", label: "All prompts" },
  { href: "/collections", label: "Collections" },
  { href: "/saved", label: "Saved prompts" },
];
const resourceLinks = [
  { href: "/ai-prompt-guide", label: "User guide" },
  { href: "/ai-tools", label: "AI tools" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/about", label: "About SeyPrompt" },
  { href: "/contact", label: "Get in touch" },
];

export async function Footer() {
  const catalog = await fetchPublicDiscovery().catch(() => null);
  const categories = discoveryCategories(catalog);

  return (
    <footer className="site-footer-v2">
      <div className="container footer-v2-inner">
        <div className="footer-v2-invitation">
          <div>
            <p className="footer-v2-eyebrow">A little inspiration goes a long way</p>
            <h2>What will you create next?</h2>
          </div>
          <Link className="footer-v2-explore" href="/prompts">
            Find your next prompt <ArrowUpRight aria-hidden="true" size={18} />
          </Link>
        </div>

        <div className="footer-v2-grid">
          <div className="footer-v2-brand">
            <Link href="/" aria-label="SeyPrompt home">
              <Image alt="SeyPrompt" src="/images/seyprompt-logo.png" width={172} height={54} />
            </Link>
            <p>Better prompts. More possibilities.<br />Bring your ideas to life, one prompt at a time.</p>
            <SocialLinks className="footer-v2-socials" />
          </div>
          <nav className="footer-v2-column" aria-label="Explore SeyPrompt">
            <h3>Explore</h3>
            {exploreLinks.map(link => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          </nav>
          <nav className="footer-v2-column" aria-label="SeyPrompt resources">
            <h3>Resources</h3>
            {resourceLinks.map(link => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          </nav>
          <nav className="footer-v2-column footer-v2-categories" aria-label="Explore prompt categories">
            <h3>Find your inspiration</h3>
            {categories.slice(0, 8).map(category => <Link href={`/categories/${category.slug}`} key={category.slug}>{category.name}</Link>)}
          </nav>
        </div>

        <div className="footer-v2-bottom">
          <p>© {new Date().getFullYear()} SeyPrompt. All rights reserved.</p>
          <nav aria-label="Legal links">
            {policyLinks.map(link => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          </nav>
        </div>
        <p className="footer-v2-company">A product of <a href={PARENT_COMPANY_URL} target="_blank" rel="noopener noreferrer">{LEGAL_OPERATOR_DISPLAY}<ArrowUpRight aria-hidden="true" size={11} /></a></p>
      </div>
    </footer>
  );
}
