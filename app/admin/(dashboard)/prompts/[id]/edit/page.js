import { notFound } from "next/navigation";
import { PromptForm } from "@/components/prompt-form";
import { fetchAdminPromptById } from "@/lib/api";
import { requireAdminToken } from "@/lib/auth";

export const metadata = {
  title: "Edit Prompt",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default async function EditPromptPage({ params }) {
  const token = await requireAdminToken();
  const { id } = await params;
  const prompt = await fetchAdminPromptById(token, id).catch(() => null);

  if (!prompt) {
    notFound();
  }

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Edit</div>
        <h2>{prompt.title}</h2>
        <p className="muted">Update the prompt content and publishing controls.</p>
      </div>
      <PromptForm mode="edit" prompt={prompt} />
    </div>
  );
}
