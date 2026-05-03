"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password")
    };

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Login failed.");
      setLoading(false);
      return;
    }

    router.replace("/admin/prompts");
    router.refresh();
  }

  return (
    <form className="panel form-card stack" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">Admin email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <button className="button" disabled={loading} type="submit">
        {loading ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
