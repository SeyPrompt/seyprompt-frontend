"use client";

import { Lock, LockOpen, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { CopyOpenButton } from "@/components/CopyOpenButton";
import { PromptCheckoutModal } from "@/components/PromptCheckoutModal";
import { useAccountAccess } from "@/components/account-access-provider";
import { useUserAuth } from "@/components/user-auth-provider";
import { fetchUserPrompt } from "@/lib/payments";
import { formatPromptPrice, getPromptPricingType } from "@/lib/prompt-pricing";

export function PremiumPromptUnlock({ prompt, description, shareUrl }) {
  const auth = useUserAuth();
  const { isPromptUnlocked } = useAccountAccess();
  const [currentPrompt, setCurrentPrompt] = useState(prompt);
  const [loadingUnlockedPrompt, setLoadingUnlockedPrompt] = useState(false);

  const isPremium = getPromptPricingType(currentPrompt) === "premium";
  const hasPremiumAccess = isPromptUnlocked(currentPrompt);
  const hasPromptText = Boolean(String(currentPrompt?.prompt || "").trim());
  const locked = isPremium && !hasPromptText;

  useEffect(() => {
    if (!auth.ready || !auth.token || !currentPrompt?.slug || hasPromptText) {
      return;
    }

    let active = true;

    fetchUserPrompt(auth.token, currentPrompt.slug)
      .then((nextPrompt) => {
        if (active) {
          setCurrentPrompt(nextPrompt);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [auth.ready, auth.token, currentPrompt?.slug, hasPromptText]);

  async function loadUnlockedPrompt() {
    if (!auth.token || !currentPrompt?.slug) {
      return;
    }

    setLoadingUnlockedPrompt(true);

    try {
      const nextPrompt = await fetchUserPrompt(auth.token, currentPrompt.slug);
      setCurrentPrompt(nextPrompt);
    } catch (_err) {
      // Keep the locked placeholder visible if the authenticated prompt cannot be loaded.
    } finally {
      setLoadingUnlockedPrompt(false);
    }
  }

  if (!locked) {
    return (
      <section className="prompt-workspace-panel prompt-workspace-prompt">
        <div className="prompt-workspace-heading">
          <div>
            <p className="eyebrow">Prompt console</p>
          </div>
          <CopyButton
            ariaLabel="Copy prompt"
            className="copy-button-primary"
            copiedLabel="Copied!"
            label="Copy prompt"
            text={currentPrompt.prompt}
            trackingLabel={currentPrompt.title || "prompt"}
          />
        </div>
        <div className="prose prompt-scroll-box">{currentPrompt.prompt}</div>
        <div className="prompt-actions-section" aria-label="Prompt actions">
          <CopyOpenButton
            description={description}
            prompt={currentPrompt}
            text={currentPrompt.prompt}
            title={currentPrompt.title}
            url={shareUrl}
            hideCopyButton
          />
        </div>
      </section>
    );
  }

  return (
    <section className="unlock-card prompt-detail-unlock-card" aria-label="Unlock premium prompt">
      <div className="unlock-card-heading">
        <span className="unlock-icon" aria-hidden="true">
          <Sparkles size={20} />
        </span>
        <div>
          <h2>Unlock the prompt console</h2>
          <p>Use the sample as proof, then unlock the exact reusable text.</p>
        </div>
      </div>

      <div className="unlock-single">
        <div>
          <p>One-time unlock</p>
          <strong>{formatPromptPrice(currentPrompt)}</strong>
        </div>
        {hasPremiumAccess ? (
          <button className="button" disabled={loadingUnlockedPrompt} onClick={loadUnlockedPrompt} type="button">
            <LockOpen aria-hidden="true" size={16} />
            {loadingUnlockedPrompt ? "Opening..." : "View unlocked"}
          </button>
        ) : (
          <PromptCheckoutModal
            initiallyUnlocked={hasPremiumAccess}
            onUnlocked={setCurrentPrompt}
            prompt={currentPrompt}
            triggerClassName="button"
            triggerLabel="Unlock"
          />
        )}
      </div>
      <p className="muted unlock-note">
        <Lock size={14} />
        The full prompt stays hidden until purchase or an active all-access plan.
      </p>
    </section>
  );
}
