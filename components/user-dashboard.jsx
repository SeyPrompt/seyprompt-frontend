"use client";

import Link from "next/link";
import SubscriptionRenewalOptions from "@/components/subscription-renewal-options";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
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
import { buildUnlockedPromptItems, isActiveEntitlement } from "@/lib/account-access";
import { trackEvent } from "@/lib/analytics";
import { POLICY_VERSION } from "@/lib/policy-info";
import {
  createCheckout,
  fetchMySubscriptions,
  subscriptionAction,
  fetchMyEntitlements,
  fetchMyPaymentOrders,
  fetchPaymentPlans,
  verifyCheckout
} from "@/lib/payments";

function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    currency: currency || "INR",
    maximumFractionDigits: Number(amount || 0) % 1 === 0 ? 0 : 2,
    style: "currency"
  }).format(Number(amount || 0));
}

function formatPlanPrice(plan) {
  return plan?.pricing?.displayPrice || formatCurrency(plan.price, plan.currency);
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium"
  }).format(new Date(value));
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

function DashboardAvatar({ initial, src }) {
  return (
    <div className="dashboard-avatar" aria-hidden="true">
      {src ? (
        <img alt="" referrerPolicy="no-referrer" src={src} />
      ) : (
        initial
      )}
    </div>
  );
}

export function UserDashboard() {
  const router = useRouter();
  const auth = useUserAuth();
  const [autoPay, setAutoPay] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadAccountPayments(token) {
    const [nextPlans, nextOrders, nextEntitlements, nextSubscriptions] = await Promise.all([
      fetchPaymentPlans(),
      fetchMyPaymentOrders(token),
      fetchMyEntitlements(token),
      fetchMySubscriptions(token)
    ]);

    setSubscriptions(nextSubscriptions);
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
    () => buildUnlockedPromptItems({ entitlements, orders }),
    [entitlements, orders]
  );
  const dashboardPrompts = purchasedPrompts.slice(0, 10);
  const hasMorePurchasedPrompts = purchasedPrompts.length > dashboardPrompts.length;

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
  const accountName = auth.user?.name || auth.user?.email || "SeyPrompt user";
  const accountInitial = accountName.slice(0, 1).toUpperCase();
  const accountAvatarUrl = auth.user?.avatarUrl || "";
  const activeAccessLabel = activeSubscription
    ? activeSubscription.expiresAt
      ? `Active until ${formatDate(activeSubscription.expiresAt)}`
      : "Lifetime all-access active"
    : "Free account";

  async function manageSubscription(subscription, cancel) {
    if (cancel && !window.confirm("Cancel future automatic renewals? Your existing paid access will remain until expiry.")) return;
    setSubscriptionBusy(true); setError("");
    try {
      await subscriptionAction(auth.token, subscription.id, cancel ? "cancel" : "", cancel ? { confirm: true } : {});
      await loadAccountPayments(auth.token);
    } catch (err) { setError(err.message); } finally { setSubscriptionBusy(false); }
  }

  async function subscribeToPlan(resume = null) {
    const checkoutPlan = resume ? plans.find((p) => p.id === resume.planId) || { name: resume.planName, id: resume.planId } : selectedPlan;
    if (!auth.token || !checkoutPlan) {
      return;
    }

    setCheckoutLoading(true);
    setError("");
    trackEvent("subscription_checkout_started", {
      plan_id: checkoutPlan.id,
      plan_slug: checkoutPlan.slug || "",
    });

    try {
      await loadRazorpayScript();
      const checkout = resume ? await subscriptionAction(auth.token, resume.id, "") : await createCheckout(auth.token, {
        type: "subscription",
        planId: checkoutPlan.id,
        paymentMode: autoPay && checkoutPlan.autoPay?.eligible ? "AUTO_RENEW" : "ONE_TIME",
        autoPayConsent: autoPay && checkoutPlan.autoPay?.eligible === true,
        acceptedTerms: true,
        termsVersion: POLICY_VERSION
      });
      if (checkout.alreadyPaid) { await loadAccountPayments(auth.token); return; }
      const razorpay = checkout.razorpay;
      if (!razorpay) throw new Error("This authorization cannot be resumed. Refresh its status or contact support.");

      await new Promise((resolve, reject) => {
        const instance = new window.Razorpay({
          key: razorpay.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: razorpay.amount,
          currency: razorpay.currency,
          name: "SeyPrompt",
          description: checkoutPlan.name,
          ...(razorpay.subscriptionId ? { subscription_id: razorpay.subscriptionId, method: razorpay.method } : { order_id: razorpay.orderId }),
          handler: async (response) => {
            try {
              if (checkout.subscription) {
                await subscriptionAction(auth.token, checkout.subscription.id, "verify", response);
              } else await verifyCheckout(auth.token, {
                paymentOrderId: checkout.order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              trackEvent("subscription_activated", {
                event_id: `subscription:${checkout.order?.id || checkout.subscription?.id}`,
                plan_id: checkoutPlan.id,
                plan_slug: checkoutPlan.slug || "",
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
      const message = checkoutError.message || "Unable to start checkout.";
      setError(message);
      trackEvent("checkout_failed", {
        checkout_target: "subscription",
        plan_id: checkoutPlan.id,
        reason: message,
      });
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
          <DashboardAvatar initial={accountInitial} src={accountAvatarUrl} />
          <div>
            <strong>{auth.user?.name || "Your account"}</strong>
            <span>{auth.user?.email}</span>
          </div>
        </div>
        <div className="dashboard-command-actions">
          <Link className="button-secondary compact" href="/saved">
            <Bookmark aria-hidden="true" size={16} />
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
          <h1>
            <span className="dashboard-desktop-copy">Build faster from prompts you already own.</span>
            <span className="dashboard-mobile-copy">Your creative workspace.</span>
          </h1>
          <p className="dashboard-desktop-copy">
            Your unlocked prompts, subscription access, and premium library actions
            now live in one focused workspace.
          </p>
          <p className="dashboard-mobile-copy">Your prompts, purchases, and access in one place.</p>
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
            <Link className="dashboard-stat-card dashboard-stat-link" href="/orders">
              <span><ReceiptText size={18} /></span>
              <strong>{paidOrderCount}</strong>
              <p>Paid orders</p>
            </Link>
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

          {entitlements.filter((e) => e.type === "subscription" && e.paymentMode !== "AUTO_RENEW").slice(0, 1).map((e) => {
            const days = e.expiresAt ? Math.ceil((new Date(e.expiresAt) - Date.now()) / 86400000) : null;
            return <div className="subscription-summary" key={e.id}>
              <strong>{e.plan?.name || "All-access"} · {isActiveEntitlement(e) ? "Active" : "Expired"}</strong>
              <p>Paid {formatCurrency(e.amountPaid, e.currency || "INR")} · One-time · AutoPay disabled</p>
              <p>Started {formatDate(e.startsAt)} · Expires {formatDate(e.expiresAt)}</p>
              {days !== null && days > 0 && days <= 7 ? <p role="status">Your subscription expires {days <= 1 ? "within 1 day" : `in ${days} days`}. Renew below to keep access.</p> : null}
            </div>;
          })}
          {subscriptions.map((s) => <div className="subscription-summary" key={s.id}>
            <strong>{s.planName} · {s.status}</strong>
            <p>AutoPay {s.autoRenewEnabled ? "enabled" : "disabled"} · {formatCurrency(s.billingAmount / 100, s.billingCurrency)} every {s.billingInterval} days</p>
            <p>Started {formatDate(s.startsAt)} · Paid access until {formatDate(s.expiresAt)}</p>
            {s.nextBillingDate ? <p>Next billing date: {formatDate(s.nextBillingDate)}</p> : null}
            {s.lastPaymentFailureAt ? <p>Last failed payment: {formatDate(s.lastPaymentFailureAt)}. Razorpay manages retries; access extends after a verified successful payment.</p> : null}
            {s.cancelAtPeriodEnd ? <p>{s.status === "cancelled" ? "AutoPay cancelled." : "Cancellation requested; awaiting gateway completion."} Paid access is retained until expiry.</p> : null}
            <button className="button-secondary compact" disabled={subscriptionBusy} onClick={() => manageSubscription(s, false)} type="button">Refresh status and payments</button>
            {!["cancelled", "completed", "expired", "creating"].includes(s.status) && !s.cancelAtPeriodEnd ? <button className="button-secondary compact" disabled={subscriptionBusy} onClick={() => manageSubscription(s, true)} type="button">Cancel AutoPay</button> : null}
            {s.status === "created" ? <button className="button-secondary compact" disabled={checkoutLoading} onClick={() => {
              if (window.confirm(`Authorize AutoPay at ${formatCurrency(s.billingAmount / 100, s.billingCurrency)} every ${s.billingInterval} days?`)) subscribeToPlan(s);
            }} type="button">Resume AutoPay authorization</button> : null}
            {s.status === "creating" ? <p>Authorization is being reconciled. Contact support before starting another checkout.</p> : null}
          </div>)}
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
                      onChange={() => { setSelectedPlanId(plan.id); setAutoPay(false); }}
                      type="radio"
                      value={plan.id}
                    />
                    <span className="dashboard-plan-icon" aria-hidden="true">
                      {index === 0 ? <Crown size={16} /> : <Zap size={16} />}
                    </span>
                    <span>
                      <strong>{formatPlanPrice(plan)} - {plan.name}</strong>
                      <small>
                        {formatPlanPrice(plan)} / {plan.durationDays} days
                      </small>
                    </span>
                  </label>
                ))}
              </div>
              <SubscriptionRenewalOptions plan={selectedPlan} enabled={autoPay} onChange={setAutoPay} disabled={checkoutLoading} />
              <p className="dashboard-policy-note">
                Prices shown are the SeyPrompt checkout total before payment.
                Manual renewal adds the selected duration after your remaining paid access.
                All plans unlock the same library; changing plans follows this same rule.
              </p>
              <button
                className="button dashboard-plan-submit"
                disabled={checkoutLoading || subscriptions.some((s) => !["cancelled", "completed", "expired"].includes(s.status))}
                onClick={() => subscribeToPlan()}
                type="button"
              >
                <ShieldCheck aria-hidden="true" size={17} />
                {checkoutLoading
                    ? "Opening Checkout..."
                    : activeSubscription || paidOrderCount
                      ? "Renew Subscription"
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
            {hasMorePurchasedPrompts ? (
              <Link className="dashboard-view-all-link" href="/unlocked-prompts">
                View all
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            ) : (
              <Sparkles aria-hidden="true" size={22} />
            )}
          </div>

          {purchasedPrompts.length ? (
            <div className="dashboard-prompt-shelf">
              {dashboardPrompts.map((entitlement) => (
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
