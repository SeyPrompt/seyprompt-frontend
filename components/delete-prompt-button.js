"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeletePromptButton({ id, iconOnly = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this prompt? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    const response = await fetch(`/api/admin/prompts/${id}`, {
      method: "DELETE"
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setLoading(false);
      window.alert(data.error || data.message || "Unable to delete this prompt.");
      return;
    }

    if (data.warning) {
      console.warn(data.warning);
    }

    router.refresh();
  }

  if (iconOnly) {
    return (
      <button
        aria-label={loading ? "Deleting prompt" : "Delete prompt"}
        className="icon-button icon-button-danger"
        disabled={loading}
        onClick={handleDelete}
        title={loading ? "Deleting..." : "Delete"}
        type="button"
      >
        <Trash2 aria-hidden="true" size={18} />
      </button>
    );
  }

  return (
    <button className="button-danger" disabled={loading} onClick={handleDelete} type="button">
      <Trash2 aria-hidden="true" size={18} />
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
