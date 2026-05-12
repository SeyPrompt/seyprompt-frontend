import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Terms of Use",
  description:
    "Read the terms for using SeyPrompt's AI prompt library, examples, and site content.",
  path: "/terms-of-use"
});

const terms = [
  {
    title: "Use of SeyPrompt",
    text:
      "SeyPrompt provides ready-made AI prompts and related content for browsing, copying, sharing, and adapting. You may use the prompts for personal, educational, creative, or business workflows."
  },
  {
    title: "No Guaranteed Results",
    text:
      "AI tools can respond differently depending on the model, settings, context, and information you provide. We do not guarantee any specific result, accuracy level, revenue outcome, ranking, or business performance from using a prompt."
  },
  {
    title: "Your Responsibility",
    text:
      "You are responsible for reviewing, editing, and validating any AI-generated output before using it. Do not use prompts or AI outputs in ways that violate laws, platform rules, intellectual property rights, privacy rights, or other people's rights."
  },
  {
    title: "Site Content",
    text:
      "The prompts, examples, page copy, design, branding, and other site materials belong to SeyPrompt or their respective owners. You may copy prompts for practical use, but you may not reproduce the full site, scrape the library at scale, or resell SeyPrompt content as a competing prompt library without permission."
  },
  {
    title: "Third-Party Tools",
    text:
      "SeyPrompt may reference tools such as ChatGPT, Claude, Midjourney, Gemini, Canva, or others. These tools are operated by third parties and are subject to their own terms, policies, and usage limits."
  },
  {
    title: "Changes to the Site",
    text:
      "We may update, remove, reorganize, or add prompts, categories, features, and pages at any time. We may also update these Terms of Use when the site changes."
  }
];

export default function TermsOfUsePage() {
  return (
    <main>
      <section className="legal-hero">
        <div className="container legal-container">
          <div className="legal-hero-copy">
            <div className="eyebrow">SeyPrompt Terms</div>
            <h1>Terms of Use</h1>
            <p>
              These terms explain how visitors may use SeyPrompt's prompt
              library, examples, and website content.
            </p>
            <span className="legal-updated">Last updated: May 12, 2026</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container legal-container legal-stack">
          <div className="panel legal-summary">
            <h2>Simple Summary</h2>
            <p>
              You can browse, copy, share, and adapt prompts. Review all AI
              outputs before relying on them, and do not reuse SeyPrompt as a
              competing copied library.
            </p>
          </div>

          <div className="legal-content">
            {terms.map((term) => (
              <article className="card legal-card" key={term.title}>
                <h2>{term.title}</h2>
                <p>{term.text}</p>
              </article>
            ))}

            <article className="card legal-card">
              <h2>Privacy</h2>
              <p>
                Our handling of analytics, contact form details, and cookies is
                described in the <Link href="/privacy-policy">Privacy Policy</Link>.
              </p>
            </article>

            <article className="card legal-card">
              <h2>Contact</h2>
              <p>
                Questions about these terms can be sent through the{" "}
                <Link href="/contact">contact page</Link>.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
