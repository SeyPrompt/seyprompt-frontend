"use client";

import { Lock, LockOpen, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAccountAccess } from "@/components/account-access-provider";
import { useUserAuth } from "@/components/user-auth-provider";
import { trackEvent } from "@/lib/analytics";
import {
  createCheckout,
  createCreditCheckout,
  createPromptCheckout,
  fetchCreditPlans,
  fetchPaymentPlans,
  fetchPromptAccessStatus,
  fetchWallet,
  fetchUserPrompt,
  unlockPromptWithCredits,
  verifyCheckout
} from "@/lib/payments";
import { formatPromptPrice } from "@/lib/prompt-pricing";
import { POLICY_VERSION } from "@/lib/policy-info";

function formatPlanPrice(plan) {
  return plan?.pricing?.displayPrice || "";
}

function formatAccessPlanPrice(plan) {
  if (plan?.pricing?.displayPrice) {
    return plan.pricing.displayPrice;
  }

  const price = Number(plan?.price || 0);
  const currency = plan?.currency || "INR";

  return new Intl.NumberFormat("en-IN", {
    currency,
    maximumFractionDigits: 0,
    style: "currency"
  }).format(price);
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Unable to load checkout."));
    document.body.appendChild(script);
  });
}

export function PromptCheckoutModal({
  initiallyUnlocked = false,
  prompt,
  onUnlocked,
  triggerClassName = "button",
  triggerLabel = "Unlock prompt"
}) {
  const auth = useUserAuth();
  const { refreshAccess } = useAccountAccess();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [accessPlans, setAccessPlans] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedAccessPlanId, setSelectedAccessPlanId] = useState("");
  const [error, setError] = useState("");
  const [loadingTarget, setLoadingTarget] = useState("");
  const [promptAlreadyUnlocked, setPromptAlreadyUnlocked] = useState(initiallyUnlocked);
  const visiblePlans = useMemo(() => plans.slice(0, 3), [plans]);
  const visibleAccessPlans = useMemo(() => accessPlans.slice(0, 3), [accessPlans]);
  const selectedPlan = visiblePlans.find((plan) => plan.id === selectedPlanId);
  const selectedAccessPlan = visibleAccessPlans.find((plan) => plan.id === selectedAccessPlanId);

  useEffect(() => {
    if (initiallyUnlocked) {
      setPromptAlreadyUnlocked(true);
    }
  }, [initiallyUnlocked]);

  useEffect(() => {
    if (!open || promptAlreadyUnlocked) {
      return undefined;
    }

    let active = true;

    Promise.all([
      fetchCreditPlans().catch(() => []),
      fetchPaymentPlans().catch(() => [])
    ])
      .then(([nextPlans, nextAccessPlans]) => {
        if (!active) {
          return;
        }
        setPlans(nextPlans);
        setSelectedPlanId(nextPlans[0]?.id || "");
        setAccessPlans(nextAccessPlans);
        setSelectedAccessPlanId(nextAccessPlans[0]?.id || "");
      })
      .catch(() => {
        if (active) {
          setPlans([]);
          setAccessPlans([]);
        }
      });

    return () => {
      active = false;
    };
  }, [open, promptAlreadyUnlocked]);

  useEffect(() => {
    if (!open || !auth.token || promptAlreadyUnlocked) {
      setWallet(null);
      return undefined;
    }

    let active = true;
    fetchWallet(auth.token)
      .then((nextWallet) => {
        if (active) {
          setWallet(nextWallet);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [auth.token, open, promptAlreadyUnlocked]);

  useEffect(() => {
    if (!open || !auth.token || !prompt?.slug) {
      return undefined;
    }

    let active = true;

    fetchPromptAccessStatus(auth.token, prompt)
      .then(async (access) => {
        if (!active || !access?.hasAccess) {
          return;
        }

        setPromptAlreadyUnlocked(true);
        setError("");
        refreshAccess();

        try {
          const unlockedPrompt = await fetchUserPrompt(auth.token, prompt.slug);
          if (active) {
            onUnlocked?.(unlockedPrompt);
          }
        } catch (_err) {
          // Access state is enough for the modal; the card can refresh later.
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [auth.token, onUnlocked, open, prompt]);

  function requireLogin() {
    router.push(`/login?redirect=${encodeURIComponent(`/prompts/${prompt.slug}`)}`);
  }

  function openPromptDetail() {
    setOpen(false);
    router.push(`/prompts/${prompt.slug}`);
  }

  async function startCheckout(target, createOrder) {
    if (!auth.token) {
      requireLogin();
      return;
    }

    setError("");
    setLoadingTarget(target);
    trackEvent(
      target === "subscription" ? "subscription_checkout_started" : "checkout_started",
      {
        checkout_target: target,
        prompt_id: prompt.id || prompt._id || "",
        prompt_slug: prompt.slug || "",
      }
    );

    try {
      await loadRazorpayScript();
      const checkout = await createOrder();
      const razorpay = checkout.razorpay;

      await new Promise((resolve, reject) => {
        const instance = new window.Razorpay({
          key: razorpay.keyId,
          amount: razorpay.amount,
          currency: razorpay.currency,
          name: "SeyPrompt",
          description: prompt.title,
          order_id: razorpay.orderId,
          handler: async (response) => {
            try {
              await verifyCheckout(auth.token, {
                paymentOrderId: checkout.order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              const unlockedPrompt = await fetchUserPrompt(auth.token, prompt.slug);
              await refreshAccess();
              trackEvent(
                target === "subscription" ? "subscription_activated" : "prompt_purchased",
                {
                  event_id: `checkout:${checkout.order.id}`,
                  checkout_target: target,
                  prompt_id: prompt.id || prompt._id || "",
                }
              );
              onUnlocked?.(unlockedPrompt);
              setOpen(false);
              resolve();
            } catch (verifyError) {
              reject(verifyError);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Checkout was closed."))
          },
          prefill: {
            name: auth.user?.name || "",
            email: auth.user?.email || ""
          },
          theme: {
            color: "#058751"
          }
        });

        instance.open();
      });
    } catch (checkoutError) {
      const message = checkoutError.message || "Unable to start checkout.";

      if (/already unlocked/i.test(message)) {
        setPromptAlreadyUnlocked(true);
        setError("");
        return;
      }

      setError(message);
      trackEvent("checkout_failed", {
        checkout_target: target,
        prompt_id: prompt.id || prompt._id || "",
        reason: message,
      });
    } finally {
      setLoadingTarget("");
    }
  }

  async function startCreditUnlock() {
    const promptId = prompt.id || prompt._id;

    if (!auth.token) {
      requireLogin();
      return;
    }

    setError("");
    setLoadingTarget("credits");

    try {
      await unlockPromptWithCredits(auth.token, promptId);
      const [unlockedPrompt, nextWallet] = await Promise.all([
        fetchUserPrompt(auth.token, prompt.slug),
        fetchWallet(auth.token).catch(() => null)
      ]);
      await refreshAccess();
      onUnlocked?.(unlockedPrompt);
      trackEvent("credits_used", {
        prompt_id: promptId,
        prompt_slug: prompt.slug || "",
      });
      if (nextWallet) {
        setWallet(nextWallet);
      }
      setOpen(false);
    } catch (unlockError) {
      setError(unlockError.message || "Unable to unlock with credits.");
    } finally {
      setLoadingTarget("");
    }
  }

  const modal = open ? (
    <div className="checkout-modal-backdrop" role="presentation">
      <section
        aria-label="Choose checkout option"
        aria-modal="true"
        className="checkout-modal"
        role="dialog"
      >
        <button
          aria-label="Close checkout"
          className="checkout-modal-close"
          onClick={() => setOpen(false)}
          type="button"
        >
          <X size={18} />
        </button>
        <div className="checkout-modal-header">
          <span className="checkout-modal-icon" aria-hidden="true">
            <Sparkles size={20} />
          </span>
          <div>
            <p className="eyebrow">Premium access</p>
            <h2>{promptAlreadyUnlocked ? "Premium prompt unlocked" : "Unlock this prompt"}</h2>
            <p>{prompt.title}</p>
          </div>
        </div>

        <div className="checkout-option checkout-option-featured">
          <div>
            <span>Single prompt</span>
            <strong>{formatPromptPrice(prompt)}</strong>
            <small>Total payable for this prompt. Access has no scheduled expiry.</small>
          </div>
          {promptAlreadyUnlocked ? (
            <button className="button checkout-unlocked-cta" onClick={openPromptDetail} type="button">
              <LockOpen aria-hidden="true" size={16} />
              View prompt
            </button>
          ) : (
            <button
              className="button"
              disabled={Boolean(loadingTarget)}
              onClick={() =>
                startCheckout("single", () =>
                  createPromptCheckout(auth.token, prompt.id || prompt._id, {
                    acceptedTerms: true,
                    termsVersion: POLICY_VERSION
                  })
                )
              }
              type="button"
            >
              {loadingTarget === "single" ? "Opening..." : "Buy prompt"}
            </button>
          )}
        </div>

        {promptAlreadyUnlocked ? (
          <button className="checkout-unlocked-link" onClick={openPromptDetail} type="button">
            <LockOpen aria-hidden="true" size={16} />
            Premium access active. Open the full prompt.
          </button>
        ) : null}

        {!promptAlreadyUnlocked && visibleAccessPlans.length ? (
          <div className="checkout-plan-section checkout-access-plan-section">
            <div className="checkout-plan-heading">
              <span>All-access plans</span>
              {selectedAccessPlan ? <strong>{formatAccessPlanPrice(selectedAccessPlan)}</strong> : null}
            </div>
            <div className="checkout-plan-grid">
              {visibleAccessPlans.map((plan) => (
                <label
                  className={`checkout-plan-card${selectedAccessPlanId === plan.id ? " selected" : ""}`}
                  key={plan.id}
                >
                  <input
                    checked={selectedAccessPlanId === plan.id}
                    name="checkoutAccessPlan"
                    onChange={() => setSelectedAccessPlanId(plan.id)}
                    type="radio"
                    value={plan.id}
                  />
                  <span>{plan.badge || plan.name}</span>
                  <strong>{formatAccessPlanPrice(plan)}</strong>
                  <small>
                    {Number(plan.durationDays || 0) >= 365
                      ? "All prompts for 1 year"
                      : `${plan.durationDays || 30} days all-access`}
                  </small>
                </label>
              ))}
            </div>
            <button
              className="button-secondary checkout-plan-button"
              disabled={!selectedAccessPlanId || Boolean(loadingTarget)}
              onClick={() =>
                startCheckout("access-plan", () =>
                  createCheckout(auth.token, {
                    type: "subscription",
                    planId: selectedAccessPlanId,
                    acceptedTerms: true,
                    termsVersion: POLICY_VERSION
                  })
                )
              }
              type="button"
            >
              {loadingTarget === "access-plan" ? "Opening..." : "Choose all-access"}
            </button>
          </div>
        ) : null}

        {!promptAlreadyUnlocked && prompt.creditUnlockEnabled && Number(prompt.creditCost || 0) > 0 ? (
          <div className="checkout-option">
            <div>
              <span>Credit unlock</span>
              <strong>{prompt.creditCost} credits</strong>
              <small>
                Your balance: {wallet?.balance ?? "-"} credits
              </small>
            </div>
            <button
              className="button-secondary"
              disabled={Boolean(loadingTarget)}
              onClick={startCreditUnlock}
              type="button"
            >
              {loadingTarget === "credits" ? "Unlocking..." : "Use credits"}
            </button>
          </div>
        ) : null}

        {!promptAlreadyUnlocked && visiblePlans.length ? (
          <div className="checkout-plan-section">
            <div className="checkout-plan-heading">
              <span>Get credits</span>
              {selectedPlan ? <strong>{formatPlanPrice(selectedPlan)}</strong> : null}
            </div>
            <div className="checkout-plan-grid">
              {visiblePlans.map((plan) => (
                <label
                  className={`checkout-plan-card${selectedPlanId === plan.id ? " selected" : ""}`}
                  key={plan.id}
                >
                  <input
                    checked={selectedPlanId === plan.id}
                    name="checkoutPlan"
                    onChange={() => setSelectedPlanId(plan.id)}
                    type="radio"
                    value={plan.id}
                  />
                  <span>{plan.badge || plan.name}</span>
                  <strong>{formatPlanPrice(plan)}</strong>
                  <small>{plan.credits} credits</small>
                </label>
              ))}
            </div>
            <button
              className="button-secondary checkout-plan-button"
              disabled={!selectedPlanId || Boolean(loadingTarget)}
              onClick={() =>
                startCheckout("plan", () =>
                  createCreditCheckout(auth.token, selectedPlanId, {
                    acceptedTerms: true,
                    termsVersion: POLICY_VERSION
                  })
                )
              }
              type="button"
            >
              {loadingTarget === "plan" ? "Opening..." : "Buy credits"}
            </button>
          </div>
        ) : null}
        <p className="checkout-policy-note">
          Prices shown are the SeyPrompt checkout total before payment. All-access
          starts when payment is confirmed and does not renew automatically.
        </p>
        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </div>
  ) : null;

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)} type="button">
        <Lock aria-hidden="true" size={16} />
        {triggerLabel}
      </button>

      {modal && typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </>
  );
}
