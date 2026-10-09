"use client";

import { Lock, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/components/user-auth-provider";
import {
  createCreditCheckout,
  createPromptCheckout,
  fetchCreditPlans,
  fetchWallet,
  fetchUserPrompt,
  unlockPromptWithCredits,
  verifyCheckout
} from "@/lib/payments";
import { formatPromptPrice } from "@/lib/prompt-pricing";

function formatPlanPrice(plan) {
  return plan?.pricing?.displayPrice || "";
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
  prompt,
  onUnlocked,
  triggerClassName = "button",
  triggerLabel = "Unlock prompt"
}) {
  const auth = useUserAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [error, setError] = useState("");
  const [loadingTarget, setLoadingTarget] = useState("");
  const visiblePlans = useMemo(() => plans.slice(0, 3), [plans]);
  const selectedPlan = visiblePlans.find((plan) => plan.id === selectedPlanId);

  useEffect(() => {
    let active = true;

    fetchCreditPlans()
      .then((nextPlans) => {
        if (!active) {
          return;
        }
        setPlans(nextPlans);
        setSelectedPlanId(nextPlans[0]?.id || "");
      })
      .catch(() => {
        if (active) {
          setPlans([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!auth.token) {
      setWallet(null);
      return;
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
  }, [auth.token]);

  function requireLogin() {
    router.push(`/login?redirect=${encodeURIComponent(`/prompts/${prompt.slug}`)}`);
  }

  async function startCheckout(target, createOrder) {
    if (!auth.token) {
      requireLogin();
      return;
    }

    setError("");
    setLoadingTarget(target);

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
      setError(checkoutError.message || "Unable to start checkout.");
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
      onUnlocked?.(unlockedPrompt);
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

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)} type="button">
        <Lock aria-hidden="true" size={16} />
        {triggerLabel}
      </button>

      {open ? (
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
                <h2>Unlock this prompt</h2>
                <p>{prompt.title}</p>
              </div>
            </div>

            <div className="checkout-option checkout-option-featured">
              <div>
                <span>Single prompt</span>
                <strong>{prompt.regionalPrices?.length ? "Regional price" : formatPromptPrice(prompt)}</strong>
                <small>Lifetime access to this prompt in your dashboard.</small>
              </div>
              <button
                className="button"
                disabled={Boolean(loadingTarget)}
                onClick={() => startCheckout("single", () => createPromptCheckout(auth.token, prompt.id || prompt._id))}
                type="button"
              >
                {loadingTarget === "single" ? "Opening..." : "Buy prompt"}
              </button>
            </div>

            {prompt.creditUnlockEnabled && Number(prompt.creditCost || 0) > 0 ? (
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

            {visiblePlans.length ? (
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
                    startCheckout("plan", () => createCreditCheckout(auth.token, selectedPlanId))
                  }
                  type="button"
                >
                  {loadingTarget === "plan" ? "Opening..." : "Buy credits"}
                </button>
              </div>
            ) : null}
            {error ? <p className="error-text">{error}</p> : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
