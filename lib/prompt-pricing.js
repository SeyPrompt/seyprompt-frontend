export function getPromptPrice(prompt) {
  const price = Number(prompt?.price || 0);

  return Number.isFinite(price) && price > 0 ? price : 0;
}

export function getPromptPricingType(prompt) {
  return prompt?.pricingType === "premium" || getPromptPrice(prompt) > 0 ? "premium" : "free";
}

export function formatPromptPrice(prompt) {
  const price = getPromptPrice(prompt);

  if (getPromptPricingType(prompt) !== "premium" || price <= 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
    style: "currency"
  }).format(price);
}
