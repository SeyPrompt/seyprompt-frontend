"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { buildRecurringPlans, RECURRING_PLAN_CURRENCIES } from "@/lib/recurring-plan-fields";

const EMPTY_PLAN = {
  name: "",
  slug: "",
  description: "",
  price: "",
  currency: "INR",
  durationDays: "30",
  badge: "",
  sortOrder: "0",
  isActive: true,
  regionalPrices: []
};

const DEFAULT_PLAN_REGIONAL_PRICES = [
  { region: "IN", currency: "INR", amount: 99, isActive: true },
  { region: "DEFAULT", currency: "USD", amount: 0, isActive: false }
];

const PRICING_REGION_OPTIONS = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "EU", label: "Europe" },
  { value: "NZ", label: "New Zealand" },
  { value: "DEFAULT", label: "Default / International" }
];

const REGION_CURRENCY_MAP = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  EU: "EUR",
  NZ: "NZD"
};
const CURRENCY_OPTIONS = ["INR", "USD", "GBP", "EUR", "NZD"];

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
    maximumFractionDigits: Number(amount || 0) % 1 === 0 ? 0 : 2,
    style: "currency"
  }).format(Number(amount || 0));
}

function currencyFractionDigits(currency) {
  return ["JPY", "KRW"].includes(String(currency || "").toUpperCase()) ? 0 : 2;
}

function minimumCheckoutAmount(currency) {
  return currencyFractionDigits(currency) === 0 ? 1 : 1;
}

function normalizeRegionalPriceForAdmin(price) {
  const currency = String(price?.currency || "").toUpperCase();
  const digits = currencyFractionDigits(currency);
  const amount =
    price?.amount !== undefined && price?.amount !== null
      ? Number(price.amount)
      : Number(price?.amountMinor || 0) / 10 ** digits;

  return {
    region: String(price?.region || "").toUpperCase(),
    currency,
    amount: Number.isFinite(amount) ? amount : 0,
    isActive: price?.isActive === true
  };
}

function getInitialPlanRegionalPrices(plan) {
  const prices =
    Array.isArray(plan?.regionalPrices) && plan.regionalPrices.length
      ? plan.regionalPrices
      : DEFAULT_PLAN_REGIONAL_PRICES.map((price) => ({
          ...price,
          amount: price.region === "IN" ? Number(plan?.price || price.amount || 0) : price.amount
        }));

  return prices.map((price, index) => ({
    id: `${price?.region || "region"}-${index}`,
    ...normalizeRegionalPriceForAdmin(price)
  }));
}

function getUsedRegions(rows, excludeRowId) {
  return new Set(
    rows
      .filter((row) => row.id !== excludeRowId)
      .map((row) => String(row.region || "").toUpperCase())
      .filter(Boolean)
  );
}

function getNextAvailableRegion(rows) {
  const usedRegions = getUsedRegions(rows);
  return PRICING_REGION_OPTIONS.find((option) => !usedRegions.has(option.value));
}

function findDuplicateRegion(rows) {
  const seen = new Set();

  for (const row of rows) {
    const region = String(row.region || "").toUpperCase();

    if (!region) {
      continue;
    }

    if (seen.has(region)) {
      return region;
    }

    seen.add(region);
  }

  return "";
}

function getRegionLabel(region) {
  return PRICING_REGION_OPTIONS.find((option) => option.value === region)?.label || region;
}

function getCurrencyForRegion(region, fallback = "USD") {
  const normalizedRegion = String(region || "").trim().toUpperCase();
  return REGION_CURRENCY_MAP[normalizedRegion] || String(fallback || "USD").trim().toUpperCase();
}

function summarizePlanPrice(plan) {
  const activePrices = Array.isArray(plan.regionalPrices)
    ? plan.regionalPrices.filter((price) => price.isActive)
    : [];

  if (!activePrices.length) {
    return formatCurrency(plan.price, plan.currency);
  }

  return activePrices
    .slice(0, 2)
    .map((price) => {
      const normalized = normalizeRegionalPriceForAdmin(price);
      return `${getRegionLabel(normalized.region)} ${formatCurrency(normalized.amount, normalized.currency)}`;
    })
    .join(" / ");
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

function buildPlanPayload(formData, regionalPriceRows = []) {
  return {
    name: String(formData.get("name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    price: Number(formData.get("price") || 0),
    currency: String(formData.get("currency") || "INR").trim() || "INR",
    durationDays: Number(formData.get("durationDays") || 0),
    autoPayEnabled: formData.get("autoPayEnabled") === "on",
    recurringPlans: buildRecurringPlans(formData),
    badge: String(formData.get("badge") || "").trim(),
    sortOrder: Number(formData.get("sortOrder") || 0),
    isActive: boolFromSelect(formData.get("isActive")),
    regionalPrices: regionalPriceRows.map((row) => ({
      region: String(row.region || "").trim().toUpperCase(),
      currency: getCurrencyForRegion(row.region, row.currency),
      amount: Number(row.amount || 0),
      isActive: Boolean(row.isActive)
    }))
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

function RecurringPlanSummary({ plan }) {
  return <div className="recurring-plan-summary">
    <span>{plan.autoPayEnabled ? "AutoPay offered" : "AutoPay not offered"}</span>
    {plan.recurringPlans?.length ? plan.recurringPlans.map((mapping) => (
      <span key={mapping.currency}>{mapping.currency}: <code>{mapping.razorpayPlanId}</code></span>
    )) : <span className="muted">No Razorpay plans linked</span>}
  </div>;
}

export function AdminPlanManager({ initialPlans = [] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [editingPlan, setEditingPlan] = useState(null);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const formValues = editingPlan || EMPTY_PLAN;
  const [regionalPriceRows, setRegionalPriceRows] = useState(() =>
    getInitialPlanRegionalPrices(EMPTY_PLAN)
  );

  useEffect(() => {
    setRegionalPriceRows(getInitialPlanRegionalPrices(editingPlan || EMPTY_PLAN));
  }, [editingPlan]);

  function updateRegionalPriceRow(rowId, field, value) {
    setRegionalPriceRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        if (field === "isActive") {
          return {
            ...row,
            isActive: Boolean(value)
          };
        }

        if (field === "region") {
          const nextRegion = String(value || "").toUpperCase();

          if (getUsedRegions(currentRows, rowId).has(nextRegion)) {
            return row;
          }

          return {
            ...row,
            region: nextRegion,
            currency: getCurrencyForRegion(nextRegion, row.currency)
          };
        }

        return {
          ...row,
          [field]: value
        };
      })
    );
  }

  function addRegionalPriceRow() {
    setRegionalPriceRows((currentRows) => {
      const nextRegion = getNextAvailableRegion(currentRows);

      if (!nextRegion) {
        return currentRows;
      }

      return [
        ...currentRows,
        {
          id: `new-${Date.now()}`,
          region: nextRegion.value,
          currency: getCurrencyForRegion(nextRegion.value),
          amount: 0,
          isActive: false
        }
      ];
    });
  }

  function removeRegionalPriceRow(rowId) {
    setRegionalPriceRows((currentRows) =>
      currentRows.length > 1 ? currentRows.filter((row) => row.id !== rowId) : currentRows
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoadingAction("save");
    const form = event.currentTarget;

    const duplicateRegion = findDuplicateRegion(regionalPriceRows);

    if (duplicateRegion) {
      setError(`${getRegionLabel(duplicateRegion)} is already added.`);
      setLoadingAction("");
      return;
    }

    const invalidActivePrice = regionalPriceRows.find((row) => {
      if (!row.isActive) {
        return false;
      }

      return (
        !row.region ||
        !row.currency ||
        Number(row.amount || 0) <= 0 ||
        Number(row.amount || 0) < minimumCheckoutAmount(row.currency)
      );
    });

    if (invalidActivePrice) {
      setError(
        `Active ${invalidActivePrice.currency || "regional"} prices must be at least ${minimumCheckoutAmount(invalidActivePrice.currency)}.`
      );
      setLoadingAction("");
      return;
    }

    let payload;
    try { payload = buildPlanPayload(new FormData(form), regionalPriceRows); }
    catch (payloadError) { setError(payloadError.message); setLoadingAction(""); return; }
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
      form.reset();
      setEditingPlan(null);
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
            <label htmlFor="plan-price">Base INR price</label>
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
            <label htmlFor="plan-currency">Base currency</label>
            <select id="plan-currency" key={`currency-${getRecordId(editingPlan) || "new"}`} name="currency" defaultValue={formValues.currency || "INR"}>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
              <option value="NZD">NZD</option>
            </select>
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
          <label className="recurring-plan-optin"><input key={`autopay-${getRecordId(editingPlan) || "new"}`} type="checkbox" name="autoPayEnabled" defaultChecked={formValues.autoPayEnabled === true} /> Offer optional AutoPay</label>
          <p className="muted">Requires the backend feature flag, account capability verification, and an exact matching gateway plan. Existing customers remain on manual renewal.</p>
          <strong id="recurring-plans-heading">Recurring plans</strong>
          <p className="muted">Enter the Razorpay subscription plan ID for each currency. Leave a field empty if AutoPay is not offered in that currency.</p>
          <div className="regional-prices-table-wrap">
            <table className="regional-prices-table recurring-plans-table" aria-labelledby="recurring-plans-heading">
              <thead><tr><th scope="col">Currency</th><th scope="col">Razorpay plan ID</th></tr></thead>
              <tbody>
                {RECURRING_PLAN_CURRENCIES.map((currency) => (
                  <tr key={currency}>
                    <th scope="row">{currency}</th>
                    <td>
                      <input aria-label={`${currency} Razorpay plan ID`} type="text"
                        key={`recurring-${getRecordId(editingPlan) || "new"}-${currency}`}
                        name={`recurringPlan_${currency}`} placeholder="plan_…"
                        pattern="plan_[a-zA-Z0-9]+" title="Razorpay plan ID starting with plan_"
                        autoComplete="off" spellCheck={false}
                        defaultValue={formValues.recurringPlans?.find((mapping) => mapping.currency === currency)?.razorpayPlanId || ""} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <small>Use a Razorpay plan matching this plan’s price, currency and exact day interval.</small>
        </div>
        <div className="field pricing-region-field">
          <div className="pricing-table-title-row">
            <label>Regional prices</label>
            <span className="muted">Currency follows the selected region. Active rows are used at checkout.</span>
          </div>
          <div className="regional-prices-table-wrap">
            <table className="regional-prices-table">
              <thead>
                <tr>
                  <th>Active</th>
                  <th>Region</th>
                  <th>Currency</th>
                  <th>Amount</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {regionalPriceRows.map((row) => {
                  const usedRegions = getUsedRegions(regionalPriceRows, row.id);

                  return (
                    <tr key={row.id}>
                      <td>
                        <input
                          aria-label={`Activate ${getRegionLabel(row.region)} price`}
                          checked={Boolean(row.isActive)}
                          onChange={(event) =>
                            updateRegionalPriceRow(row.id, "isActive", event.target.checked)
                          }
                          type="checkbox"
                        />
                      </td>
                      <td>
                        <select
                          aria-label="Plan price region"
                          value={row.region}
                          onChange={(event) =>
                            updateRegionalPriceRow(row.id, "region", event.target.value)
                          }
                        >
                          {PRICING_REGION_OPTIONS.map((option) => (
                            <option
                              disabled={usedRegions.has(option.value)}
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          aria-label="Plan price currency"
                          disabled={row.region !== "DEFAULT"}
                          onChange={(event) =>
                            updateRegionalPriceRow(row.id, "currency", event.target.value)
                          }
                          value={row.currency}
                        >
                          {CURRENCY_OPTIONS.map((currencyOption) => (
                            <option key={currencyOption} value={currencyOption}>
                              {currencyOption}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          aria-label={`${getRegionLabel(row.region)} amount`}
                          min="0"
                          onChange={(event) =>
                            updateRegionalPriceRow(row.id, "amount", event.target.value)
                          }
                          step="0.01"
                          type="number"
                          value={row.amount}
                        />
                      </td>
                      <td>
                        <button
                          aria-label={`Remove ${getRegionLabel(row.region)} price`}
                          className="button-secondary compact button-icon"
                          disabled={regionalPriceRows.length <= 1}
                          onClick={() => removeRegionalPriceRow(row.id)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            className="button-secondary add-region-button"
            disabled={!getNextAvailableRegion(regionalPriceRows)}
            onClick={addRegionalPriceRow}
            type="button"
          >
            <Plus aria-hidden="true" size={16} />
            Add region
          </button>
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
                <th>Recurring plans</th>
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
                  <td>{summarizePlanPrice(plan)}</td>
                  <td>{plan.durationDays} days</td>
                  <td><RecurringPlanSummary plan={plan} /></td>
                  <td><StatusBadge tone={plan.isActive === false ? "muted" : "success"}>{plan.isActive === false ? "Inactive" : "Active"}</StatusBadge></td>
                  <td>
                    <div className="toolbar admin-table-actions">
                      <button aria-label={`Edit ${plan.name}`} className="icon-button" onClick={() => setEditingPlan(plan)} title="Edit" type="button">
                        <Pencil aria-hidden="true" size={18} />
                      </button>
                      <button aria-label={`Delete ${plan.name}`} className="icon-button icon-button-danger" disabled={loadingAction === `delete-${getRecordId(plan)}`} onClick={() => deletePlan(plan)} title="Delete" type="button">
                        <Trash2 aria-hidden="true" size={16} />
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
                <span>{summarizePlanPrice(plan)}</span>
                <span>{plan.durationDays} days</span>
                <RecurringPlanSummary plan={plan} />
                <StatusBadge tone={plan.isActive === false ? "muted" : "success"}>{plan.isActive === false ? "Inactive" : "Active"}</StatusBadge>
              </div>
              <div className="toolbar admin-table-actions">
                <button aria-label={`Edit ${plan.name}`} className="icon-button" onClick={() => setEditingPlan(plan)} title="Edit" type="button">
                  <Pencil aria-hidden="true" size={18} />
                </button>
                <button aria-label={`Delete ${plan.name}`} className="icon-button icon-button-danger" disabled={loadingAction === `delete-${getRecordId(plan)}`} onClick={() => deletePlan(plan)} title="Delete" type="button">
                  <Trash2 aria-hidden="true" size={18} />
                </button>
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
    const form = event.currentTarget;

    const payload = buildCouponPayload(new FormData(form));
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
      form.reset();
      setEditingCoupon(null);
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
                      <button aria-label={`Edit ${coupon.code}`} className="icon-button" onClick={() => setEditingCoupon(coupon)} title="Edit" type="button">
                        <Pencil aria-hidden="true" size={18} />
                      </button>
                      <button aria-label={`Delete ${coupon.code}`} className="icon-button icon-button-danger" disabled={loadingAction === `delete-${getRecordId(coupon)}`} onClick={() => deleteCoupon(coupon)} title="Delete" type="button">
                        <Trash2 aria-hidden="true" size={16} />
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
                <button aria-label={`Edit ${coupon.code}`} className="icon-button" onClick={() => setEditingCoupon(coupon)} title="Edit" type="button">
                  <Pencil aria-hidden="true" size={18} />
                </button>
                <button aria-label={`Delete ${coupon.code}`} className="icon-button icon-button-danger" disabled={loadingAction === `delete-${getRecordId(coupon)}`} onClick={() => deleteCoupon(coupon)} title="Delete" type="button">
                  <Trash2 aria-hidden="true" size={18} />
                </button>
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
                  <p className="muted">{entitlement.paymentMode || "ONE_TIME"} · AutoPay {entitlement.autoRenewEnabled ? "enabled" : "disabled"}</p>
                  {entitlement.razorpaySubscriptionId ? <p className="muted">Gateway: {entitlement.razorpaySubscriptionId} · {entitlement.subscriptionStatus}
                    {" · "}{formatCurrency(entitlement.billingAmount / 100, entitlement.billingCurrency)}
                    {entitlement.cancelAtPeriodEnd ? " · Cancellation requested" : ""}
                    {entitlement.lastPaymentFailureAt ? ` · Last failed payment ${formatDate(entitlement.lastPaymentFailureAt)}` : ""}
                  </p> : null}
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
