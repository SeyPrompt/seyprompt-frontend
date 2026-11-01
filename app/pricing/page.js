import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
export const metadata = createPageMetadata({ title: "Prompt Pricing", description: "Explore free prompts, individual premium prompts, and all-access plans.", path: "/pricing" });
export default function PricingPage() {
  return <main className="section"><div className="container stack"><div><h1 className="page-title">Your next idea starts here.</h1><p className="page-subtitle">Start exploring for free. Choose premium access when you find something you love.</p></div><div className="discovery-collection-grid pricing-options">
    <article className="panel"><span className="pricing-option-label">Explore</span><h2>Free prompts</h2><p>Discover ready-to-use prompts across photos, design, business, learning and more.</p><Link className="button-secondary" href="/prompts?pricing=free">Browse free prompts</Link></article>
    <article className="panel"><span className="pricing-option-label">Create more</span><h2>Premium prompts</h2><p>Purchase individual prompts or use credits where available. See the current price on each prompt.</p><Link className="button-secondary" href="/prompts?pricing=premium">Explore premium prompts</Link></article>
    <article className="panel"><span className="pricing-option-label">Go further</span><h2>All-access plans</h2><p>View the available plans, current prices, and premium access options in your account.</p><Link className="button-primary" href="/dashboard#plans">View available plans</Link></article>
  </div></div></main>;
}
