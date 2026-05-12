import Link from "next/link";
import Image from "next/image";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Best AI Tools for 2026 - Compare ChatGPT, Claude, Gemini",
  description:
    "Compare popular AI tools by use case, pricing, strengths, and matching prompts.",
  path: "/ai-tools",
  keywords: ["AI tools comparison", "ChatGPT alternatives", "best AI tools", "AI prompts"]
});

const tools = [
  {
    name: "ChatGPT",
    logo: "/icons/chatgpt.svg",
    description:
      "A versatile AI assistant for writing, brainstorming, coding help, research, and daily productivity.",
    bestFor: "Writing, coding, everyday work",
    pricing: "Free plan; Plus from $20/month; Pro tiers for heavier usage",
    strengths: "Broad assistant workflows, coding help, file analysis, image generation",
    promptTool: "ChatGPT",
    url: "https://chatgpt.com/",
    pricingUrl: "https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus"
  },
  {
    name: "Claude",
    logo: "/icons/claude.svg",
    description:
      "A strong AI assistant for long-form thinking, document analysis, careful writing, and deep reasoning.",
    bestFor: "Long documents, careful writing",
    pricing: "Free plan; Pro commonly starts at $20/month in the US",
    strengths: "Long context, polished writing, analysis-heavy work",
    promptTool: "Claude",
    url: "https://claude.ai/",
    pricingUrl: "https://support.anthropic.com/en/articles/8325610-how-much-does-claude-pro-cost"
  },
  {
    name: "Gemini",
    logo: "/icons/gemini.svg",
    description:
      "A multimodal AI assistant for research, writing, planning, and productivity across Google workflows.",
    bestFor: "Google workflows, multimodal research",
    pricing: "Free plan; Google AI Pro from $19.99/month; Ultra from $249.99/month",
    strengths: "Search-connected work, Google app ecosystem, video and research features",
    promptTool: "Gemini",
    url: "https://gemini.google.com/",
    pricingUrl: "https://gemini.google/subscriptions/?hl=en-US"
  },
  {
    name: "Perplexity",
    logo: "/icons/perplexity-ai-icon.svg",
    description:
      "An answer engine for web research, source-backed exploration, and quick comparisons.",
    bestFor: "Research with sources",
    pricing: "Free plan; paid Pro and Enterprise options available",
    strengths: "Fast web research, citations, answer refinement",
    promptTool: "Perplexity",
    url: "https://www.perplexity.ai/",
    pricingUrl: "https://www.perplexity.ai/pro"
  },
  {
    name: "Midjourney",
    logo: "/icons/midjourney.svg",
    description:
      "A creative image generation platform for concept art, campaign visuals, moodboards, and visual exploration.",
    bestFor: "Image concepts and art direction",
    pricing: "Paid plans for regular image generation",
    strengths: "Stylized visuals, creative exploration, high-impact image prompting",
    promptTool: "Midjourney",
    url: "https://www.midjourney.com/",
    pricingUrl: "https://www.midjourney.com/account"
  },
  {
    name: "Canva AI",
    logo: "/icons/canva-icon.svg",
    description:
      "A design-focused AI toolkit for social posts, presentations, brand assets, and quick visual production.",
    bestFor: "Design and branded assets",
    pricing: "Free plan; paid Canva plans unlock more AI and team features",
    strengths: "Templates, brand kits, social designs, presentations",
    promptTool: "Canva",
    url: "https://www.canva.com/ai/",
    pricingUrl: "https://www.canva.com/pricing/"
  }
];

const comparisons = [
  { useCase: "Everyday writing and ideation", bestTool: "ChatGPT", runnerUp: "Claude" },
  { useCase: "Long-form editing and document analysis", bestTool: "Claude", runnerUp: "ChatGPT" },
  { useCase: "Research with current sources", bestTool: "Perplexity", runnerUp: "Gemini" },
  { useCase: "Google Workspace productivity", bestTool: "Gemini", runnerUp: "ChatGPT" },
  { useCase: "Image concepts and visual prompts", bestTool: "Midjourney", runnerUp: "Canva AI" },
  { useCase: "Social designs and presentations", bestTool: "Canva AI", runnerUp: "Gemini" }
];

export default function AiToolsPage() {
  return (
    <main>
      <section className="tools-hero">
        <div className="container tools-hero-inner">
          <div className="eyebrow">AI tools list</div>
          <h1>Top AI Tools You Should Know</h1>
          <p>Discover the best AI platforms to boost your productivity</p>
        </div>
      </section>

      <section className="section">
        <div className="container tools-stack">
          <div className="tools-section-heading">
            <h2>Best AI Tools for 2026</h2>
            <p className="muted">
              Compare popular platforms by practical use case, current pricing
              shape, and the SeyPrompt prompts that fit each tool.
            </p>
          </div>

          <div className="tools-grid">
            {tools.map((tool) => (
              <article className="card tool-card" key={tool.name}>
                <div className="tool-card-top">
                  <div className="home-tool-mark" aria-hidden="true">
                    {tool.logo ? (
                      <Image
                        src={tool.logo}
                        alt={tool.name}
                        className="home-tool-logo"
                        height={36}
                        loading="lazy"
                        width={36}
                      />
                    ) : (
                      tool.name.slice(0, 1)
                    )}
                  </div>
                  <span className="tool-badge">Best for {tool.bestFor}</span>
                </div>
                <div>
                  <h3>{tool.name}</h3>
                  <p className="muted">{tool.description}</p>
                </div>
                <dl className="tool-facts">
                  <div>
                    <dt>Pricing</dt>
                    <dd>{tool.pricing}</dd>
                  </div>
                  <div>
                    <dt>Strength</dt>
                    <dd>{tool.strengths}</dd>
                  </div>
                </dl>
                <div className="tool-card-actions">
                  <a
                    className="button-secondary compact"
                    href={tool.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Visit Tool
                  </a>
                  <a
                    className="button-secondary compact"
                    href={tool.pricingUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Pricing
                  </a>
                  <Link
                    className="button compact"
                    href={{ pathname: "/prompts", query: { tool: tool.promptTool } }}
                  >
                    Matching Prompts
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section tools-soft-section">
        <div className="container tools-stack">
          <div className="tools-section-heading">
            <h2>Which tool should you use?</h2>
            <p className="muted">
              Pick the tool based on the kind of output you need most often.
            </p>
          </div>

          <div className="panel comparison-card">
            <div className="comparison-row comparison-head">
              <span>Use Case</span>
              <span>Best Tool</span>
              <span>Runner Up</span>
            </div>
            {comparisons.map((item) => (
              <div className="comparison-row" key={item.useCase}>
                <span>{item.useCase}</span>
                <strong>{item.bestTool}</strong>
                <span>{item.runnerUp}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="tools-cta">
            <h2>Find prompts matched to your AI tool</h2>
            <Link className="button" href="/prompts">
              Explore Prompt Library
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
