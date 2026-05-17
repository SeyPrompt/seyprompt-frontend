"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePromptButton({ id }) {
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

  return (
    <button className="button-danger" disabled={loading} onClick={handleDelete}>
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
