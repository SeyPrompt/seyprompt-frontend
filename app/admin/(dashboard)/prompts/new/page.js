import { PromptForm } from "@/components/prompt-form";

export const metadata = {
  title: "Create Prompt",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default function NewPromptPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Create</div>
        <h2>New prompt entry</h2>
        <p className="muted">
          Draft and publish prompts with tools, tags, category, and visibility controls.
        </p>
      </div>
      <PromptForm mode="create" />
    </div>
  );
}
