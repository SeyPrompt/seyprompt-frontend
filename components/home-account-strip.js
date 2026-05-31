"use client";

import Link from "next/link";
import { BookmarkCheck } from "lucide-react";
import { useUserAuth } from "@/components/user-auth-provider";

export function HomeAccountStrip() {
  const auth = useUserAuth();
  const isLoggedIn = auth.ready && auth.isAuthenticated;

  return (
    <section className="section home-account-section" aria-labelledby="home-account-title">
      <div className="container">
        <div className="home-account-strip">
          <div className="home-account-icon" aria-hidden="true">
            <BookmarkCheck size={24} strokeWidth={2} />
          </div>
          <div className="home-account-copy">
            <div className="eyebrow">{isLoggedIn ? "Your library" : "Make it yours"}</div>
            <h2 id="home-account-title">
              {isLoggedIn
                ? "Your saved prompts are ready when you are."
                : "Save prompts and pick up where you left off."}
            </h2>
            <p className="muted">
              {isLoggedIn
                ? "Jump back into favorite prompts, reuse what works, and keep building your personal prompt library."
                : "Keep favorite prompts tied to your account so they are ready whenever you return, across devices."}
            </p>
          </div>
          <div className="home-account-actions">
            {isLoggedIn ? (
              <>
                <Link className="button" href="/saved">
                  Open Saved Prompts
                </Link>
                <Link className="button-secondary" href="/prompts">
                  Browse Prompts
                </Link>
              </>
            ) : (
              <>
                <Link className="button" href="/register">
                  Create Account
                </Link>
                <Link className="button-secondary" href="/saved">
                  View Saved
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
