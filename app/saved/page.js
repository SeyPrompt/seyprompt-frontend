import { SavedPromptsClient } from "@/components/saved-prompts-client";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Saved Prompts",
  description: "Save your favorite prompts and reuse them anytime.",
  path: "/saved"
});

export default function SavedPromptsPage() {
  return (
    <main className="section">
      <div className="container stack">
        <div>
          <div className="eyebrow">Saved prompts</div>
          <h1 className="page-title">Your prompt shelf</h1>
          <p className="page-subtitle">
            Save your favorite prompts and reuse them anytime.
          </p>
        </div>
        <SavedPromptsClient />
      </div>
    </main>
  );
}
