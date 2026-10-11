function currencyFractionDigits(currency) {
  return ["JPY", "KRW"].includes(String(currency || "").toUpperCase()) ? 0 : 2;
}

function minimumCheckoutAmount(currency) {
  return currencyFractionDigits(currency) === 0 ? 1 : 1;
}

function regionalPriceAmount(price) {
  const currency = String(price?.currency || "").toUpperCase();
  const digits = currencyFractionDigits(currency);
  const amount =
    price?.displayAmount !== undefined && price?.displayAmount !== null
      ? Number(price.displayAmount)
      : price?.amount !== undefined && price?.amount !== null
        ? Number(price.amount)
        : Number(price?.amountMinor || 0) / 10 ** digits;

  return Number.isFinite(amount) && amount > 0
    && amount >= minimumCheckoutAmount(currency)
    ? { amount, currency: currency || "INR", displayPrice: price?.displayPrice || "" }
    : null;
}

function getResolvedPromptPrice(prompt) {
  if (prompt?.pricing) {
    const pricing = regionalPriceAmount(prompt.pricing);

    if (pricing) {
      return pricing;
    }
  }

  const activeRegionalPrices = Array.isArray(prompt?.regionalPrices)
    ? prompt.regionalPrices.filter((price) => price?.isActive === true)
    : [];
  const fallbackPrice =
    activeRegionalPrices.find((price) => String(price?.region || "").toUpperCase() === "DEFAULT") ||
    activeRegionalPrices[0];
  const regionalPrice = regionalPriceAmount(fallbackPrice);

  if (regionalPrice) {
    return regionalPrice;
  }

  const price = Number(prompt?.price || 0);
  const currency = prompt?.currency || "INR";

  return Number.isFinite(price) && price > 0 ? { amount: price, currency } : null;
}

export function getPromptPrice(prompt) {
  return getResolvedPromptPrice(prompt)?.amount || 0;
}

function getPromptCurrency(prompt) {
  return getResolvedPromptPrice(prompt)?.currency || prompt?.currency || "INR";
}

export function getPromptPricingType(prompt) {
  return prompt?.pricingType === "premium" || getPromptPrice(prompt) > 0 ? "premium" : "free";
}

export function formatPromptPrice(prompt) {
  const resolvedPrice = getResolvedPromptPrice(prompt);
  const price = resolvedPrice?.amount || 0;

  if (getPromptPricingType(prompt) !== "premium" || price <= 0) {
    return getPromptPricingType(prompt) === "premium" ? "Unavailable" : "Free";
  }

  if (resolvedPrice?.displayPrice) {
    return resolvedPrice.displayPrice;
  }

  return new Intl.NumberFormat("en-IN", {
    currency: getPromptCurrency(prompt),
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
    style: "currency"
  }).format(price);
}

export function formatPromptPriceParts(prompt) {
  const pricingType = getPromptPricingType(prompt);

  if (pricingType !== "premium") {
    return { label: "Free", suffix: "" };
  }

  return { label: formatPromptPrice(prompt), suffix: "ONLY" };
}
