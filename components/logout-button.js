"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", {
      method: "POST"
    });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button className="button-secondary" onClick={handleLogout} disabled={loading}>
      {loading ? "Signing out..." : "Logout"}
    </button>
  );
}
