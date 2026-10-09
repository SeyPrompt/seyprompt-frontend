"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";

const EMPTY_PLAN = {
  name: "",
  slug: "",
  description: "",
  price: "",
  currency: "INR",
  durationDays: "30",
  badge: "",
  sortOrder: "0",
  isActive: true
};

const EMPTY_COUPON = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  appliesTo: "all",
  maxRedemptions: "",
  startsAt: "",
  expiresAt: "",
  isActive: true
};

const EMPTY_GRANT = {
  userId: "",
  type: "single_prompt",
  promptId: "",
  planId: "",
  durationDays: "30",
  notes: ""
};

function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    currency: currency || "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Number(amount || 0));
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function getRecordId(record) {
  return record?.id || record?._id;
}

async function parseAdminResponse(response, fallbackMessage) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || body.message || fallbackMessage);
  }

  return body;
}

function boolFromSelect(value) {
  return String(value) === "true";
}

function buildPlanPayload(formData) {
  return {
    name: String(formData.get("name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    price: Number(formData.get("price") || 0),
    currency: String(formData.get("currency") || "INR").trim() || "INR",
    durationDays: Number(formData.get("durationDays") || 0),
    badge: String(formData.get("badge") || "").trim(),
    sortOrder: Number(formData.get("sortOrder") || 0),
    isActive: boolFromSelect(formData.get("isActive"))
  };
}

function buildCouponPayload(formData) {
  const startsAt = String(formData.get("startsAt") || "");
  const expiresAt = String(formData.get("expiresAt") || "");
  const maxRedemptions = String(formData.get("maxRedemptions") || "").trim();

  return {
    code: String(formData.get("code") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    discountType: String(formData.get("discountType") || "percent"),
    discountValue: Number(formData.get("discountValue") || 0),
    appliesTo: String(formData.get("appliesTo") || "all"),
    maxRedemptions: maxRedemptions ? Number(maxRedemptions) : "",
    startsAt: startsAt || "",
    expiresAt: expiresAt || "",
    isActive: boolFromSelect(formData.get("isActive"))
  };
}

function buildGrantPayload(formData) {
  const type = String(formData.get("type") || "single_prompt");

  return {
    userId: String(formData.get("userId") || "").trim(),
    type,
    promptId: type === "single_prompt" ? String(formData.get("promptId") || "").trim() : "",
    planId: type === "subscription" ? String(formData.get("planId") || "").trim() : "",
    durationDays: Number(formData.get("durationDays") || 0),
    notes: String(formData.get("notes") || "").trim()
  };
}

function StatusBadge({ children, tone = "default" }) {
  const className =
    tone === "danger"
      ? "status-badge status-badge-danger"
      : tone === "muted"
        ? "status-badge status-badge-muted"
        : "status-badge status-badge-success";

  return <span className={className}>{children}</span>;
}

export function AdminPlanManager({ initialPlans = [] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [editingPlan, setEditingPlan] = useState(null);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const formValues = editingPlan || EMPTY_PLAN;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoadingAction("save");

    const payload = buildPlanPayload(new FormData(event.currentTarget));
    const planId = getRecordId(editingPlan);
    const endpoint = planId ? `/api/admin/plans/${planId}` : "/api/admin/plans";
    const method = planId ? "PUT" : "POST";

    try {
      const savedPlan = await parseAdminResponse(
        await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }),
        "Unable to save plan."
      );

      setPlans((currentPlans) => {
        if (!planId) {
          return [...currentPlans, savedPlan].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
        }

        return currentPlans.map((plan) => (getRecordId(plan) === planId ? savedPlan : plan));
      });
      setEditingPlan(null);
      event.currentTarget.reset();
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoadingAction("");
    }
  }

  async function deletePlan(plan) {
    const planId = getRecordId(plan);

    if (!planId || !window.confirm(`Delete ${plan.name}?`)) {
      return;
    }

    setLoadingAction(`delete-${planId}`);
    setError("");

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, { method: "DELETE" });

      if (!response.ok && response.status !== 204) {
        await parseAdminResponse(response, "Unable to delete plan.");
      }

      setPlans((currentPlans) => currentPlans.filter((item) => getRecordId(item) !== planId));
      router.refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <div className="admin-payment-grid">
      <form className="panel form-card stack admin-payment-form" onSubmit={handleSubmit}>
        <div>
          <h2>{editingPlan ? "Edit Plan" : "Create Plan"}</h2>
          <p className="muted">Plans unlock every premium prompt for the selected duration.</p>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="plan-name">Name</label>
            <input id="plan-name" key={`name-${getRecordId(editingPlan) || "new"}`} maxLength={80} name="name" required defaultValue={formValues.name || ""} />
          </div>
          <div className="field">
            <label htmlFor="plan-slug">Slug</label>
            <input id="plan-slug" key={`slug-${getRecordId(editingPlan) || "new"}`} maxLength={80} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required defaultValue={formValues.slug || ""} />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="plan-price">Price</label>
            <input id="plan-price" key={`price-${getRecordId(editingPlan) || "new"}`} min="1" name="price" required step="1" type="number" defaultValue={formValues.price || ""} />
          </div>
          <div className="field">
            <label htmlFor="plan-duration">Duration days</label>
            <input id="plan-duration" key={`duration-${getRecordId(editingPlan) || "new"}`} min="1" name="durationDays" required step="1" type="number" defaultValue={formValues.durationDays || ""} />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="plan-badge">Badge</label>
            <input id="plan-badge" key={`badge-${getRecordId(editingPlan) || "new"}`} maxLength={40} name="badge" defaultValue={formValues.badge || ""} />
          </div>
          <div className="field">
            <label htmlFor="plan-sort">Sort order</label>
            <input id="plan-sort" key={`sort-${getRecordId(editingPlan) || "new"}`} min="0" name="sortOrder" step="1" type="number" defaultValue={formValues.sortOrder ?? "0"} />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="plan-currency">Currency</label>
            <input id="plan-currency" key={`currency-${getRecordId(editingPlan) || "new"}`} maxLength={6} name="currency" defaultValue={formValues.currency || "INR"} />
          </div>
          <div className="field">
            <label htmlFor="plan-active">Status</label>
            <select id="plan-active" key={`active-${getRecordId(editingPlan) || "new"}`} name="isActive" defaultValue={String(formValues.isActive !== false)}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="plan-description">Description</label>
          <textarea id="plan-description" key={`description-${getRecordId(editingPlan) || "new"}`} maxLength={500} name="description" rows={3} defaultValue={formValues.description || ""} />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="toolbar">
          <button className="button" disabled={Boolean(loadingAction)} type="submit">
            {loadingAction === "save" ? "Saving..." : editingPlan ? "Save Plan" : "Create Plan"}
          </button>
          {editingPlan ? (
            <button className="button-secondary" disabled={Boolean(loadingAction)} onClick={() => setEditingPlan(null)} type="button">
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="panel form-card">
        <div className="section-header">
          <div>
            <strong>{plans.length}</strong> <span className="muted">plan records</span>
          </div>
        </div>
        <div className="table-wrap admin-payment-table-wrap">
          <table className="table admin-payment-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={getRecordId(plan)}>
                  <td>
                    <strong>{plan.name}</strong>
                    <div className="muted">{plan.slug}</div>
                  </td>
                  <td>{formatCurrency(plan.price, plan.currency)}</td>
                  <td>{plan.durationDays} days</td>
                  <td><StatusBadge tone={plan.isActive === false ? "muted" : "success"}>{plan.isActive === false ? "Inactive" : "Active"}</StatusBadge></td>
                  <td>
                    <div className="toolbar admin-table-actions">
                      <button className="button-secondary compact" onClick={() => setEditingPlan(plan)} type="button">Edit</button>
                      <button className="button-danger compact" disabled={loadingAction === `delete-${getRecordId(plan)}`} onClick={() => deletePlan(plan)} type="button">
                        <Trash2 aria-hidden="true" size={16} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-card-list">
          {plans.map((plan) => (
            <article className="admin-prompt-card" key={getRecordId(plan)}>
              <div>
                <strong>{plan.name}</strong>
                <p className="muted">{plan.slug}</p>
              </div>
              <div className="admin-card-meta">
                <span>{formatCurrency(plan.price, plan.currency)}</span>
                <span>{plan.durationDays} days</span>
                <StatusBadge tone={plan.isActive === false ? "muted" : "success"}>{plan.isActive === false ? "Inactive" : "Active"}</StatusBadge>
              </div>
              <div className="toolbar admin-table-actions">
                <button className="button-secondary compact" onClick={() => setEditingPlan(plan)} type="button">Edit</button>
                <button className="button-danger compact" disabled={loadingAction === `delete-${getRecordId(plan)}`} onClick={() => deletePlan(plan)} type="button">Delete</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminCouponManager({ initialCoupons = [] }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const formValues = editingCoupon || EMPTY_COUPON;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoadingAction("save");

    const payload = buildCouponPayload(new FormData(event.currentTarget));
    const couponId = getRecordId(editingCoupon);
    const endpoint = couponId ? `/api/admin/coupons/${couponId}` : "/api/admin/coupons";
    const method = couponId ? "PUT" : "POST";

    try {
      const savedCoupon = await parseAdminResponse(
        await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }),
        "Unable to save coupon."
      );

      setCoupons((currentCoupons) => {
        if (!couponId) {
          return [savedCoupon, ...currentCoupons];
        }

        return currentCoupons.map((coupon) => (getRecordId(coupon) === couponId ? savedCoupon : coupon));
      });
      setEditingCoupon(null);
      event.currentTarget.reset();
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoadingAction("");
    }
  }

  async function deleteCoupon(coupon) {
    const couponId = getRecordId(coupon);

    if (!couponId || !window.confirm(`Delete coupon ${coupon.code}?`)) {
      return;
    }

    setLoadingAction(`delete-${couponId}`);
    setError("");

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, { method: "DELETE" });

      if (!response.ok && response.status !== 204) {
        await parseAdminResponse(response, "Unable to delete coupon.");
      }

      setCoupons((currentCoupons) => currentCoupons.filter((item) => getRecordId(item) !== couponId));
      router.refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <div className="admin-payment-grid">
      <form className="panel form-card stack admin-payment-form" onSubmit={handleSubmit}>
        <div>
          <h2>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</h2>
          <p className="muted">Coupons can discount a single prompt, a plan, or both.</p>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="coupon-code">Code</label>
            <input id="coupon-code" key={`code-${getRecordId(editingCoupon) || "new"}`} maxLength={40} name="code" required defaultValue={formValues.code || ""} />
          </div>
          <div className="field">
            <label htmlFor="coupon-applies">Applies to</label>
            <select id="coupon-applies" key={`applies-${getRecordId(editingCoupon) || "new"}`} name="appliesTo" defaultValue={formValues.appliesTo || "all"}>
              <option value="all">All purchases</option>
              <option value="single_prompt">Single prompts</option>
              <option value="subscription">Plans</option>
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="coupon-discount-type">Discount type</label>
            <select id="coupon-discount-type" key={`type-${getRecordId(editingCoupon) || "new"}`} name="discountType" defaultValue={formValues.discountType || "percent"}>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="coupon-discount-value">Discount value</label>
            <input id="coupon-discount-value" key={`value-${getRecordId(editingCoupon) || "new"}`} min="0" name="discountValue" required step="1" type="number" defaultValue={formValues.discountValue || ""} />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="coupon-max">Max redemptions</label>
            <input id="coupon-max" key={`max-${getRecordId(editingCoupon) || "new"}`} min="1" name="maxRedemptions" step="1" type="number" defaultValue={formValues.maxRedemptions || ""} />
          </div>
          <div className="field">
            <label htmlFor="coupon-active">Status</label>
            <select id="coupon-active" key={`active-${getRecordId(editingCoupon) || "new"}`} name="isActive" defaultValue={String(formValues.isActive !== false)}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="coupon-starts">Starts</label>
            <input id="coupon-starts" key={`starts-${getRecordId(editingCoupon) || "new"}`} name="startsAt" type="date" defaultValue={toDateInputValue(formValues.startsAt)} />
          </div>
          <div className="field">
            <label htmlFor="coupon-expires">Expires</label>
            <input id="coupon-expires" key={`expires-${getRecordId(editingCoupon) || "new"}`} name="expiresAt" type="date" defaultValue={toDateInputValue(formValues.expiresAt)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="coupon-description">Description</label>
          <textarea id="coupon-description" key={`description-${getRecordId(editingCoupon) || "new"}`} maxLength={500} name="description" rows={3} defaultValue={formValues.description || ""} />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="toolbar">
          <button className="button" disabled={Boolean(loadingAction)} type="submit">
            {loadingAction === "save" ? "Saving..." : editingCoupon ? "Save Coupon" : "Create Coupon"}
          </button>
          {editingCoupon ? (
            <button className="button-secondary" disabled={Boolean(loadingAction)} onClick={() => setEditingCoupon(null)} type="button">
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="panel form-card">
        <div className="section-header">
          <div>
            <strong>{coupons.length}</strong> <span className="muted">coupon records</span>
          </div>
        </div>
        <div className="table-wrap admin-payment-table-wrap">
          <table className="table admin-payment-table">
            <thead>
              <tr>
                <th>Coupon</th>
                <th>Discount</th>
                <th>Usage</th>
                <th>Window</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={getRecordId(coupon)}>
                  <td>
                    <strong>{coupon.code}</strong>
                    <div className="muted">{coupon.appliesTo || "all"}</div>
                  </td>
                  <td>{coupon.discountType === "percent" ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}</td>
                  <td>{coupon.redeemedCount || 0}{coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ""}</td>
                  <td>
                    <div className="muted">From {formatDate(coupon.startsAt)}</div>
                    <div className="muted">Until {formatDate(coupon.expiresAt)}</div>
                  </td>
                  <td><StatusBadge tone={coupon.isActive === false ? "muted" : "success"}>{coupon.isActive === false ? "Inactive" : "Active"}</StatusBadge></td>
                  <td>
                    <div className="toolbar admin-table-actions">
                      <button className="button-secondary compact" onClick={() => setEditingCoupon(coupon)} type="button">Edit</button>
                      <button className="button-danger compact" disabled={loadingAction === `delete-${getRecordId(coupon)}`} onClick={() => deleteCoupon(coupon)} type="button">
                        <Trash2 aria-hidden="true" size={16} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-card-list">
          {coupons.map((coupon) => (
            <article className="admin-prompt-card" key={getRecordId(coupon)}>
              <div>
                <strong>{coupon.code}</strong>
                <p className="muted">{coupon.appliesTo || "all"}</p>
              </div>
              <div className="admin-card-meta">
                <span>{coupon.discountType === "percent" ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}</span>
                <span>{coupon.redeemedCount || 0}{coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ""} used</span>
                <StatusBadge tone={coupon.isActive === false ? "muted" : "success"}>{coupon.isActive === false ? "Inactive" : "Active"}</StatusBadge>
              </div>
              <div className="toolbar admin-table-actions">
                <button className="button-secondary compact" onClick={() => setEditingCoupon(coupon)} type="button">Edit</button>
                <button className="button-danger compact" disabled={loadingAction === `delete-${getRecordId(coupon)}`} onClick={() => deleteCoupon(coupon)} type="button">Delete</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminPaymentsManager({
  entitlements = [],
  orders = [],
  plans = [],
  prompts = [],
  users = []
}) {
  const router = useRouter();
  const [grantType, setGrantType] = useState(EMPTY_GRANT.type);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  const promptOptions = useMemo(
    () => prompts.filter((prompt) => getRecordId(prompt) && prompt.title),
    [prompts]
  );
  const planOptions = useMemo(
    () => plans.filter((plan) => getRecordId(plan) && plan.name),
    [plans]
  );
  const userOptions = useMemo(
    () => users.filter((user) => getRecordId(user) && (user.email || user.name)),
    [users]
  );

  async function refundOrder(order) {
    const orderId = getRecordId(order);

    if (!orderId) {
      return;
    }

    const reason = window.prompt("Refund reason", "Admin refund");

    if (reason === null) {
      return;
    }

    setLoadingAction(`refund-${orderId}`);
    setError("");

    try {
      await parseAdminResponse(
        await fetch(`/api/admin/payments/${orderId}/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason })
        }),
        "Unable to refund order."
      );
      router.refresh();
    } catch (refundError) {
      setError(refundError.message);
    } finally {
      setLoadingAction("");
    }
  }

  async function grantEntitlement(event) {
    event.preventDefault();
    setLoadingAction("grant");
    setError("");

    try {
      await parseAdminResponse(
        await fetch("/api/admin/entitlements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildGrantPayload(new FormData(event.currentTarget)))
        }),
        "Unable to grant entitlement."
      );
      event.currentTarget.reset();
      setGrantType(EMPTY_GRANT.type);
      router.refresh();
    } catch (grantError) {
      setError(grantError.message);
    } finally {
      setLoadingAction("");
    }
  }

  async function revokeEntitlement(entitlement) {
    const entitlementId = getRecordId(entitlement);

    if (!entitlementId) {
      return;
    }

    const reason = window.prompt("Revoke reason", "Revoked by admin.");

    if (reason === null) {
      return;
    }

    setLoadingAction(`revoke-${entitlementId}`);
    setError("");

    try {
      await parseAdminResponse(
        await fetch(`/api/admin/entitlements/${entitlementId}/revoke`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason })
        }),
        "Unable to revoke entitlement."
      );
      router.refresh();
    } catch (revokeError) {
      setError(revokeError.message);
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <div className="stack">
      {error ? <p className="form-error">{error}</p> : null}

      <div className="panel form-card">
        <div className="section-header">
          <div>
            <strong>{orders.length}</strong> <span className="muted">payment orders</span>
          </div>
        </div>
        <div className="table-wrap admin-payment-table-wrap">
          <table className="table admin-payment-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>User</th>
                <th>Item</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const item = order.prompt?.title || order.plan?.name || order.type;
                const refundable = order.status === "paid" && order.providerPaymentId;

                return (
                  <tr key={getRecordId(order)}>
                    <td>
                      <strong>{order.providerOrderId || getRecordId(order)}</strong>
                      <div className="muted">{order.providerPaymentId || "No payment id"}</div>
                    </td>
                    <td>
                      <strong>{order.user?.email || "Unknown user"}</strong>
                      {order.user?.name ? <div className="muted">{order.user.name}</div> : null}
                    </td>
                    <td>
                      <strong>{item}</strong>
                      <div className="muted">{order.type}</div>
                    </td>
                    <td>
                      <strong>{formatCurrency(order.amount, order.currency)}</strong>
                      {Number(order.discountAmount || 0) > 0 ? (
                        <div className="muted">Discount {formatCurrency(order.discountAmount, order.currency)}</div>
                      ) : null}
                    </td>
                    <td><StatusBadge tone={order.status === "refunded" ? "muted" : order.status === "paid" ? "success" : "default"}>{order.status}</StatusBadge></td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <button className="button-secondary compact" disabled={!refundable || Boolean(loadingAction)} onClick={() => refundOrder(order)} type="button">
                        <RotateCcw aria-hidden="true" size={16} />
                        Refund
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="admin-card-list">
          {orders.map((order) => {
            const refundable = order.status === "paid" && order.providerPaymentId;

            return (
              <article className="admin-prompt-card" key={getRecordId(order)}>
                <div>
                  <strong>{order.prompt?.title || order.plan?.name || order.type}</strong>
                  <p className="muted">{order.user?.email || order.providerOrderId || getRecordId(order)}</p>
                </div>
                <div className="admin-card-meta">
                  <span>{formatCurrency(order.amount, order.currency)}</span>
                  <StatusBadge tone={order.status === "refunded" ? "muted" : order.status === "paid" ? "success" : "default"}>{order.status}</StatusBadge>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <button className="button-secondary compact" disabled={!refundable || Boolean(loadingAction)} onClick={() => refundOrder(order)} type="button">Refund</button>
              </article>
            );
          })}
        </div>
      </div>

      <div className="admin-payment-grid">
        <form className="panel form-card stack admin-payment-form" onSubmit={grantEntitlement}>
          <div>
            <h2>Grant Entitlement</h2>
            <p className="muted">Manual access can unlock one prompt or all premium prompts.</p>
          </div>
          <div className="field">
            <label htmlFor="grant-user">User</label>
            <select id="grant-user" name="userId" required defaultValue="">
              <option value="" disabled>Select user</option>
              {userOptions.map((user) => (
                <option key={getRecordId(user)} value={getRecordId(user)}>
                  {user.email || user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="grant-type">Type</label>
              <select id="grant-type" name="type" onChange={(event) => setGrantType(event.target.value)} defaultValue={EMPTY_GRANT.type}>
                <option value="single_prompt">Single prompt</option>
                <option value="subscription">All prompts</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="grant-duration">Duration days</label>
              <input id="grant-duration" min="1" name="durationDays" step="1" type="number" defaultValue={EMPTY_GRANT.durationDays} />
            </div>
          </div>
          {grantType === "single_prompt" ? (
            <div className="field">
              <label htmlFor="grant-prompt">Prompt</label>
              <select id="grant-prompt" name="promptId" required defaultValue="">
                <option value="" disabled>Select prompt</option>
                {promptOptions.map((prompt) => (
                  <option key={getRecordId(prompt)} value={getRecordId(prompt)}>
                    {prompt.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field">
              <label htmlFor="grant-plan">Plan</label>
              <select id="grant-plan" name="planId" required defaultValue="">
                <option value="" disabled>Select plan</option>
                {planOptions.map((plan) => (
                  <option key={getRecordId(plan)} value={getRecordId(plan)}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="grant-notes">Notes</label>
            <textarea id="grant-notes" maxLength={500} name="notes" rows={3} />
          </div>
          <button className="button" disabled={loadingAction === "grant"} type="submit">
            {loadingAction === "grant" ? "Granting..." : "Grant Access"}
          </button>
        </form>

        <div className="panel form-card">
          <div className="section-header">
            <div>
              <strong>{entitlements.length}</strong> <span className="muted">entitlement records</span>
            </div>
          </div>
          <div className="admin-card-list admin-entitlement-list">
            {entitlements.map((entitlement) => {
              const revoked = Boolean(entitlement.revokedAt);

              return (
                <article className="admin-prompt-card" key={getRecordId(entitlement)}>
                  <div>
                    <strong>{entitlement.prompt?.title || entitlement.plan?.name || entitlement.type}</strong>
                    <p className="muted">{entitlement.user?.email || entitlement.type}</p>
                  </div>
                  <div className="admin-card-meta">
                    {entitlement.user?.name ? <span>{entitlement.user.name}</span> : null}
                    <span>Starts {formatDate(entitlement.startsAt)}</span>
                    <span>Expires {formatDate(entitlement.expiresAt)}</span>
                    <StatusBadge tone={revoked ? "danger" : "success"}>{revoked ? "Revoked" : "Active"}</StatusBadge>
                  </div>
                  {entitlement.notes ? <p className="muted">{entitlement.notes}</p> : null}
                  <button className="button-danger compact" disabled={revoked || Boolean(loadingAction)} onClick={() => revokeEntitlement(entitlement)} type="button">
                    Revoke
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
