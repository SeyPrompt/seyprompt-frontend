import Link from "next/link";
import Image from "next/image";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Best AI Tools for 2026 - ChatGPT, Claude, Midjourney",
  description:
    "Explore the best AI tools for writing, coding, design, and productivity.",
  path: "/ai-tools",
  keywords: ["AI tools list", "ChatGPT alternatives", "best AI tools", "AI prompts"]
});

const tools = [
  {
    name: "ChatGPT",
    logo: "/icons/chatgpt.svg",
    description:
      "A versatile AI assistant for writing, brainstorming, coding help, research, and daily productivity.",
    bestFor: "Writing",
    url: "#",
  },
  {
    name: "Claude",
    logo: "/icons/claude.svg",
    description:
      "A strong AI assistant for long-form thinking, document analysis, careful writing, and deep reasoning.",
    bestFor: "Long text",
    url: "#",
  },
  {
    name: "Midjourney",
    logo: "/icons/midjourney.svg",
    description:
      "A creative image generation platform for concept art, campaign visuals, moodboards, and visual exploration.",
    bestFor: "Images",
    url: "#",
  },
  {
    name: "Canva AI",
    logo: "/icons/canva-icon.svg",
    description:
      "A design-focused AI toolkit for social posts, presentations, brand assets, and quick visual production.",
    bestFor: "Design",
    url: "#",
  },
  {
    name: "Gemini",
    logo: "/icons/gemini.svg",
    description:
      "A multimodal AI assistant for research, writing, planning, and productivity across Google workflows.",
    bestFor: "Productivity",
    url: "#",
  },
];

const comparisons = [
  { useCase: "Writing", bestTool: "ChatGPT" },
  { useCase: "Long text", bestTool: "Claude" },
  { useCase: "Images", bestTool: "Midjourney" },
  { useCase: "Design", bestTool: "Canva" },
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
              Compare popular platforms for writing, coding, design, visual
              work, and everyday productivity.
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
                <Link className="button-secondary compact" href={tool.url}>
                  Visit Tool
                </Link>
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
            </div>
            {comparisons.map((item) => (
              <div className="comparison-row" key={item.useCase}>
                <span>{item.useCase}</span>
                <strong>{item.bestTool}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="tools-cta">
            <h2>Find prompts for these tools</h2>
            <Link className="button" href="/prompts">
              Explore Prompt Library
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
