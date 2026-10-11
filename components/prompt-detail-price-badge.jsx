"use client";

import { useAccountAccess } from "@/components/account-access-provider";
import { formatPromptPriceParts, getPromptPricingType } from "@/lib/prompt-pricing";

export function PromptDetailPriceBadge({ prompt }) {
  const { isPromptUnlocked } = useAccountAccess();
  const pricingType = getPromptPricingType(prompt);
  const displayPrice = formatPromptPriceParts(prompt);
  const isUnlocked = isPromptUnlocked(prompt);

  return (
    <div
      className={`prompt-hero-offer-badge prompt-hero-offer-${pricingType}${isUnlocked && pricingType === "premium" ? " price-badge-owned" : ""}`}
      aria-label={`${displayPrice.label} ${displayPrice.suffix || "access"}`}
    >
      <span className="prompt-hero-offer-kicker">
        {pricingType === "premium" ? "Premium" : "Free"}
      </span>
      <strong>{displayPrice.label}</strong>
      <small>{displayPrice.suffix || "ACCESS"}</small>
    </div>
  );
}
