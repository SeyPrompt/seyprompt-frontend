"use client";
import { useState } from "react";
import { useUserAuth } from "@/components/user-auth-provider";
import { apiUrl } from "@/utils/api";

export function LoginMetadataPrivacy() {
  const { token } = useUserAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (!token) return null;
  async function erase() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(apiUrl("/api/user/login-metadata"), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error();
      try { window.sessionStorage.removeItem("seyprompt_first_referral_v1"); } catch { /* Storage may be disabled. */ }
      setMessage("Stored sign-in metadata deleted. Future successful sign-ins start a new history.");
    } catch { setMessage("Unable to delete sign-in metadata. Please try again or contact support."); }
    finally { setBusy(false); }
  }
  return <section className="panel stack">
    <h2>Sign-in privacy</h2>
    <p>Sign-in history helps secure your account. IP addresses expire after seven days and history after 90 days. You can delete stored sign-in metadata, including referral labels and counts, here.</p>
    <p>SeyPrompt does not request GPS permission or store precise coordinates.</p>
    <button className="button-secondary" disabled={busy} onClick={erase}>{busy ? "Deleting…" : "Delete sign-in metadata"}</button>
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}
