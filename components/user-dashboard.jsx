"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Crown,
  Library,
  LogOut,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap
} from "lucide-react";
import { useUserAuth } from "@/components/user-auth-provider";
import {
  createCheckout,
  fetchMyEntitlements,
  fetchMyPaymentOrders,
  fetchPaymentPlans,
  verifyCheckout
} from "@/lib/payments";

function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    currency: currency || "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Number(amount || 0));
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function isActiveEntitlement(entitlement) {
  if (!entitlement || entitlement.revokedAt) {
    return false;
  }

  if (!entitlement.expiresAt) {
    return true;
  }

  return new Date(entitlement.expiresAt).getTime() > Date.now();
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
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

export function UserDashboard() {
  const router = useRouter();
  const auth = useUserAuth();
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadAccountPayments(token) {
    const [nextPlans, nextOrders, nextEntitlements] = await Promise.all([
      fetchPaymentPlans(),
      fetchMyPaymentOrders(token),
      fetchMyEntitlements(token)
    ]);

    setPlans(nextPlans);
    setOrders(nextOrders);
    setEntitlements(nextEntitlements);
    setSelectedPlanId((current) => current || nextPlans[0]?.id || "");
  }

  useEffect(() => {
    if (auth.ready && !auth.isAuthenticated) {
      router.replace("/login");
    }
  }, [auth.isAuthenticated, auth.ready, router]);

  useEffect(() => {
    if (!auth.ready || !auth.token) {
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    loadAccountPayments(auth.token)
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || "Unable to load your purchases.");
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

  const purchasedPrompts = useMemo(
    () =>
      entitlements.filter(
        (entitlement) =>
          entitlement.type === "single_prompt" &&
          entitlement.prompt &&
          isActiveEntitlement(entitlement)
      ),
    [entitlements]
  );

  const activeSubscription = useMemo(
    () =>
      entitlements.find(
        (entitlement) =>
          entitlement.type === "subscription" && isActiveEntitlement(entitlement)
      ),
    [entitlements]
  );

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || plans[0];
  const paidOrderCount = orders.filter((order) => order.status === "paid").length;
  const activeAccessLabel = activeSubscription
    ? activeSubscription.expiresAt
      ? `Active until ${formatDate(activeSubscription.expiresAt)}`
      : "Lifetime all-access active"
    : "Free account";

  async function subscribeToPlan() {
    if (!auth.token || !selectedPlan) {
      return;
    }

    setCheckoutLoading(true);
    setError("");

    try {
      await loadRazorpayScript();
      const checkout = await createCheckout(auth.token, {
        type: "subscription",
        planId: selectedPlan.id
      });
      const razorpay = checkout.razorpay;

      await new Promise((resolve, reject) => {
        const instance = new window.Razorpay({
          key: razorpay.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: razorpay.amount,
          currency: razorpay.currency,
          name: "SeyPrompt",
          description: selectedPlan.name,
          order_id: razorpay.orderId,
          handler: async (response) => {
            try {
              await verifyCheckout(auth.token, {
                paymentOrderId: checkout.order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              await loadAccountPayments(auth.token);
              resolve();
            } catch (verifyError) {
              reject(verifyError);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Checkout was closed before payment."))
          },
          prefill: {
            name: auth.user?.name || "",
            email: auth.user?.email || ""
          },
          theme: {
            color: "#058751"
          }
        });

        instance.on("payment.failed", (response) => {
          reject(
            new Error(
              response?.error?.description || "Payment failed. Please try again."
            )
          );
        });

        instance.open();
      });
    } catch (checkoutError) {
      setError(checkoutError.message || "Unable to start checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (!auth.ready || loading) {
    return (
      <div className="panel form-card dashboard-loading">
        <p className="muted">Loading your purchases...</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div className="dashboard-workbench">
      <header className="dashboard-command-bar">
        <div className="dashboard-identity">
          <div className="dashboard-avatar" aria-hidden="true">
            {(auth.user?.name || auth.user?.email || "S").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <strong>{auth.user?.name || "Your account"}</strong>
            <span>{auth.user?.email}</span>
          </div>
        </div>
        <div className="dashboard-command-actions">
          <Link className="button-secondary compact" href="/saved">
            Saved prompts
          </Link>
          <button className="button-danger compact" onClick={auth.logout} type="button">
            <LogOut aria-hidden="true" size={16} />
            Logout
          </button>
        </div>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="dashboard-topology">
        <div className="dashboard-intro-panel">
          <p className="eyebrow">Creator workspace</p>
          <h1>Build faster from prompts you already own.</h1>
          <p>
            Your unlocked prompts, subscription access, and premium library actions
            now live in one focused workspace.
          </p>
          <div className="dashboard-quick-actions">
            <Link className="button" href="/prompts">
              Explore prompt library
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <span className="dashboard-access-pill">
              <ShieldCheck aria-hidden="true" size={16} />
              {activeAccessLabel}
            </span>
          </div>
          <div className="dashboard-stat-grid" aria-label="Dashboard overview">
            <div className="dashboard-stat-card">
              <span><Library size={18} /></span>
              <strong>{purchasedPrompts.length}</strong>
              <p>Prompt unlocks</p>
            </div>
            <div className="dashboard-stat-card">
              <span><Crown size={18} /></span>
              <strong>{activeSubscription ? "Active" : "Off"}</strong>
              <p>All-access</p>
            </div>
            <div className="dashboard-stat-card">
              <span><ReceiptText size={18} /></span>
              <strong>{paidOrderCount}</strong>
              <p>Paid orders</p>
            </div>
          </div>
        </div>

        <aside className="dashboard-plan-console" aria-label="Premium plans">
          <div className="dashboard-console-header">
            <span className="dashboard-console-icon" aria-hidden="true">
              <Crown size={22} />
            </span>
            <div>
              <p className="eyebrow">All-access pass</p>
              <h2>{activeSubscription ? "Access is active" : "Choose your unlock"}</h2>
            </div>
          </div>
          <p>
            {activeSubscription
              ? "Every premium prompt is available across the library."
              : "Unlock every premium prompt plus future paid drops from one place."}
          </p>

          {plans.length ? (
            <>
              <div className="dashboard-plan-stack">
                {plans.map((plan, index) => (
                  <label
                    className={`dashboard-plan-option${selectedPlanId === plan.id ? " selected" : ""}`}
                    key={plan.id}
                  >
                    <input
                      checked={selectedPlanId === plan.id}
                      name="dashboardWorkbenchPlan"
                      onChange={() => setSelectedPlanId(plan.id)}
                      type="radio"
                      value={plan.id}
                    />
                    <span className="dashboard-plan-icon" aria-hidden="true">
                      {index === 0 ? <Crown size={16} /> : <Zap size={16} />}
                    </span>
                    <span>
                      <strong>{formatCurrency(plan.price, plan.currency)} - {plan.name}</strong>
                      <small>
                        {plan.durationDays >= 365
                          ? `${formatCurrency(plan.price, plan.currency)}/year`
                          : `${formatCurrency(plan.price, plan.currency)}/${plan.durationDays} days`}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
              <button
                className="button dashboard-plan-submit"
                disabled={checkoutLoading || Boolean(activeSubscription)}
                onClick={subscribeToPlan}
                type="button"
              >
                <ShieldCheck aria-hidden="true" size={17} />
                {activeSubscription
                  ? "Plan Active"
                  : checkoutLoading
                    ? "Opening Checkout..."
                    : paidOrderCount
                      ? "Upgrade Access"
                      : "Subscribe Now"}
              </button>
            </>
          ) : (
            <div className="dashboard-no-plans">No premium plans are available right now.</div>
          )}
        </aside>
      </section>

      <section className="dashboard-lower-grid">
        <div className="dashboard-vault-board" aria-label="Purchased prompts">
          <div className="dashboard-board-heading">
            <div>
              <p className="eyebrow">Prompt shelf</p>
              <h2>Your unlocked prompts</h2>
            </div>
            <Sparkles aria-hidden="true" size={22} />
          </div>

          {purchasedPrompts.length ? (
            <div className="dashboard-prompt-shelf">
              {purchasedPrompts.map((entitlement) => (
                <Link
                  className="dashboard-prompt-tile"
                  href={`/prompts/${entitlement.prompt.slug}`}
                  key={entitlement.id}
                >
                  <span aria-hidden="true">
                    <WandSparkles size={18} />
                  </span>
                  <strong>{entitlement.prompt.title}</strong>
                  <small>
                    {entitlement.expiresAt
                      ? `Access until ${formatDate(entitlement.expiresAt)}`
                      : "Lifetime access"}
                  </small>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-vault">
              <WandSparkles aria-hidden="true" size={30} />
              <h2>No prompt unlocks yet</h2>
              <p>Buy a single premium prompt or activate an all-access plan to start filling this shelf.</p>
              <Link className="button" href="/prompts">
                Browse prompts
              </Link>
            </div>
          )}
        </div>

        <aside className="dashboard-access-board" aria-label="Access details">
          <div className="dashboard-board-heading">
            <div>
              <p className="eyebrow">Access map</p>
              <h2>What your account can do</h2>
            </div>
          </div>
          <div className="dashboard-access-list">
            <span><ShieldCheck size={16} /> Copy full premium prompts</span>
            <span><ShieldCheck size={16} /> Reopen purchased prompts anytime</span>
            <span><ShieldCheck size={16} /> Browse premium-only content</span>
            <span><ShieldCheck size={16} /> Keep future plan unlocks in sync</span>
          </div>
          <div className="dashboard-receipt-card">
            <ReceiptText aria-hidden="true" size={20} />
            <div>
              <strong>{paidOrderCount} paid {paidOrderCount === 1 ? "order" : "orders"}</strong>
              <p>Payment history and refunds are managed by SeyPrompt support.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
