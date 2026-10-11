"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, WandSparkles } from "lucide-react";
import { useUserAuth } from "@/components/user-auth-provider";
import { buildUnlockedPromptItems } from "@/lib/account-access";
import { fetchMyEntitlements, fetchMyPaymentOrders } from "@/lib/payments";

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function UnlockedPromptsClient() {
  const auth = useUserAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.ready && !auth.isAuthenticated) {
      router.replace("/login?redirect=/unlocked-prompts");
    }
  }, [auth.isAuthenticated, auth.ready, router]);

  useEffect(() => {
    if (!auth.ready || !auth.token) {
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    Promise.all([fetchMyPaymentOrders(auth.token), fetchMyEntitlements(auth.token)])
      .then(([nextOrders, nextEntitlements]) => {
        if (active) {
          setOrders(nextOrders);
          setEntitlements(nextEntitlements);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || "Unable to load unlocked prompts.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [auth.ready, auth.token]);

  const unlockedPrompts = useMemo(
    () => buildUnlockedPromptItems({ entitlements, orders }),
    [entitlements, orders]
  );

  if (!auth.ready || loading) {
    return <div className="account-panel">Loading unlocked prompts...</div>;
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  if (!unlockedPrompts.length) {
    return (
      <div className="account-empty-state">
        <WandSparkles aria-hidden="true" size={30} />
        <h2>No unlocked prompts yet</h2>
        <p>Purchased prompt unlocks will appear here after checkout.</p>
        <Link className="button" href="/prompts">
          Browse prompts
        </Link>
      </div>
    );
  }

  return (
    <div className="account-card-grid">
      {unlockedPrompts.map((item) => (
        <Link
          className="account-prompt-card"
          href={`/prompts/${item.prompt.slug}`}
          key={item.id}
        >
          <span aria-hidden="true">
            <WandSparkles size={18} />
          </span>
          <strong>{item.prompt.title}</strong>
          <small>
            {item.expiresAt ? `Access until ${formatDate(item.expiresAt)}` : "Lifetime access"}
          </small>
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      ))}
    </div>
  );
}
