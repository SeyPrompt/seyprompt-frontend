export function isActiveEntitlement(entitlement) {
  if (!entitlement || entitlement.revokedAt) {
    return false;
  }

  if (!entitlement.expiresAt) {
    return true;
  }

  return new Date(entitlement.expiresAt).getTime() > Date.now();
}

export function getPromptKey(prompt) {
  return prompt?.id || prompt?._id || prompt?.slug || "";
}

export function getOrderAccessExpiry(order) {
  if (order?.priceSnapshot?.periodEnd) return new Date(order.priceSnapshot.periodEnd);
  const durationDays = Number(order?.priceSnapshot?.durationDays || order?.plan?.durationDays || 0);

  if (!durationDays) {
    return null;
  }

  const startsAt = order.paidAt || order.finalizedAt || order.createdAt;

  if (!startsAt) {
    return new Date(0);
  }

  return new Date(new Date(startsAt).getTime() + durationDays * 24 * 60 * 60 * 1000);
}

export function isActiveSubscriptionOrder(order) {
  if (!order || order.status !== "paid" || order.type !== "subscription") {
    return false;
  }

  const expiresAt = getOrderAccessExpiry(order);
  return !expiresAt || expiresAt.getTime() > Date.now();
}

export function hasActiveAllAccess({ entitlements = [], orders = [] } = {}) {
  return (
    entitlements.some(
      (entitlement) =>
        ["subscription", "manual", "admin", "promotion"].includes(entitlement.type) &&
        !entitlement.prompt &&
        isActiveEntitlement(entitlement)
    ) || orders.some(isActiveSubscriptionOrder)
  );
}

export function getUnlockedPromptKeys({ entitlements = [], orders = [] } = {}) {
  const promptKeys = new Set();

  entitlements
    .filter((entitlement) => entitlement.prompt && isActiveEntitlement(entitlement))
    .forEach((entitlement) => {
      const key = getPromptKey(entitlement.prompt);

      if (key) {
        promptKeys.add(key);
      }
    });

  orders
    .filter(
      (order) =>
        order.status === "paid" &&
        ["single_prompt", "direct_prompt"].includes(order.type) &&
        order.prompt
    )
    .forEach((order) => {
      const key = getPromptKey(order.prompt);

      if (key) {
        promptKeys.add(key);
      }
    });

  return promptKeys;
}

export function buildPromptAccessState({ entitlements = [], orders = [] } = {}) {
  return {
    hasAllAccess: hasActiveAllAccess({ entitlements, orders }),
    promptKeys: getUnlockedPromptKeys({ entitlements, orders })
  };
}

export function isPromptUnlockedForAccess(prompt, accessState, pricingType = "premium") {
  if (!prompt || pricingType !== "premium") {
    return false;
  }

  if (accessState?.hasAllAccess) {
    return true;
  }

  return [prompt.id, prompt._id, prompt.slug]
    .filter(Boolean)
    .some((key) => accessState?.promptKeys?.has(key));
}

export function buildUnlockedPromptItems({ entitlements = [], orders = [] } = {}) {
  const promptsByKey = new Map();

  entitlements
    .filter(
      (entitlement) =>
        entitlement.type === "single_prompt" &&
        entitlement.prompt &&
        isActiveEntitlement(entitlement)
    )
    .forEach((entitlement) => {
      const key = getPromptKey(entitlement.prompt);

      if (key) {
        promptsByKey.set(key, {
          id: entitlement.id,
          expiresAt: entitlement.expiresAt,
          prompt: entitlement.prompt,
          source: "entitlement"
        });
      }
    });

  orders
    .filter(
      (order) =>
        order.status === "paid" &&
        ["single_prompt", "direct_prompt"].includes(order.type) &&
        order.prompt
    )
    .forEach((order) => {
      const key = getPromptKey(order.prompt);

      if (key && !promptsByKey.has(key)) {
        promptsByKey.set(key, {
          id: `order-${order.id}`,
          expiresAt: null,
          prompt: order.prompt,
          source: "order"
        });
      }
    });

  return Array.from(promptsByKey.values());
}
