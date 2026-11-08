import { ArrowUpRight } from "lucide-react";

const types = {
  github: { label: "GitHub", action: "View on GitHub" },
  template: { label: "Template", action: "Open template" },
  workflow: { label: "Workflow", action: "Open workflow" },
  resource: { label: "Resource", action: "Visit website" }
};

export function ExternalListingBadges({ listing, overlay = false }) {
  let priceLabel;
  if (listing.priceBadge === "free") {
    priceLabel = "Free";
  } else if (listing.priceBadge === "paid") {
    priceLabel = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: listing.externalCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(listing.externalPrice);
  }

  return (
    <div className={`external-listing-badges${overlay ? " external-listing-badges-overlay" : ""}`}>
      <span className="pill">{types[listing.externalType]?.label || "External link"}</span>
      {priceLabel ? <span className="pill">{priceLabel}</span> : null}
    </div>
  );
}

export function ExternalListingAction({ listing }) {
  return (
    <a className="button compact" href={listing.redirectUrl} target="_blank" rel="noopener noreferrer">
      {types[listing.externalType]?.action || "Visit website"}
      <ArrowUpRight size={15} aria-hidden="true" />
    </a>
  );
}
