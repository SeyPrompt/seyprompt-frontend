import { UnlockedPromptsClient } from "@/components/unlocked-prompts-client";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata("Unlocked Prompts");

export default function UnlockedPromptsPage() {
  return (
    <main className="section">
      <div className="container stack">
        <div>
          <div className="eyebrow">Prompt shelf</div>
          <h1 className="page-title">Your unlocked prompts</h1>
          <p className="page-subtitle">
            Every individually purchased premium prompt you can reopen anytime.
          </p>
        </div>
        <UnlockedPromptsClient />
      </div>
    </main>
  );
}
