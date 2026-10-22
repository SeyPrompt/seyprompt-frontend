import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAdminUserById } from "@/lib/api";
import { requireAdminToken } from "@/lib/auth";
import { AdminUserActions } from "@/components/admin-user-actions";

export const metadata = {
  title: "User Details",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

function formatDate(value) {
  if (!value) {
    return "Not Available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not Available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatBoolean(value) {
  return value == null ? "Not Available" : value ? "Yes" : "No";
}

function formatCreatedByAdmin(value) {
  if (typeof value === "object" && value) {
    return value.email || value.name || value._id || value.id || "Yes";
  }

  return formatBoolean(Boolean(value));
}

function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    currency: currency || "INR",
    maximumFractionDigits: Number(amount || 0) % 1 === 0 ? 0 : 2,
    style: "currency"
  }).format(Number(amount || 0));
}

function formatCreatedMedium(user) {
  return user.authProvider === "google" || user.createdMedium === "gmail" ? "Gmail" : "Mail";
}

function formatMembershipStatus(summary, fallback = "free") {
  if (!summary?.label) {
    return fallback;
  }

  return summary.planName ? `${summary.label}: ${summary.planName}` : summary.label;
}

function formatPurchaseType(order) {
  if (order.type === "subscription") {
    return "Membership purchase";
  }

  if (order.type === "credit_plan") {
    return "Credit purchase";
  }

  return "Prompt purchase";
}

function formatPurchaseStatus(status) {
  return status === "paid" ? "Success" : status || "-";
}

export default async function UserDetailPage({ params }) {
  const token = await requireAdminToken();
  const { id } = await params;
  if (!/^[a-fA-F0-9]{24}$/.test(id)) notFound();
  const user = await fetchAdminUserById(token, id).catch((error) => {
    if (error.status === 404) return null;
    throw error;
  });

  if (!user) {
    notFound();
  }

  const latest = user.loginHistory?.[0];
  const available = (value) => value ?? "Not Available";
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">User details</div>
        <h2>{user.name || user.email || "User"}</h2>
        <p className="muted">Review this account before making changes.</p>
      </div>
      <div className="panel form-card stack">
        <h3>Account Details</h3>
        {user.avatarUrl && /^https:\/\//.test(user.avatarUrl) ? (
          <img src={user.avatarUrl} alt="Account profile" width={64} height={64} referrerPolicy="no-referrer" />
        ) : <p className="muted">Profile picture: Not Available</p>}
        <dl className="admin-detail-grid">
          <div>
            <dt>Name</dt>
            <dd>{user.name || "Not Available"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email || "Not Available"}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{user.role || "user"}</dd>
          </div>
          <div>
            <dt>Membership</dt>
            <dd>{formatMembershipStatus(user.membershipSummary, user.membershipType || "free")}</dd>
          </div>
          <div>
            <dt>Created medium</dt>
            <dd>{formatCreatedMedium(user)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{user.status || "active"}</dd>
          </div>
          <div>
            <dt>Email verified</dt>
            <dd>{formatBoolean(user.isEmailVerified)}</dd>
          </div>
          <div>
            <dt>Created by admin</dt>
            <dd>{formatCreatedByAdmin(user.createdByAdmin)}</dd>
          </div>
          <div>
            <dt>Last login</dt>
            <dd>{formatDate(user.lastLoginAt)}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
          {user.deletedAt ? (
            <div>
              <dt>Deleted</dt>
              <dd>{formatDate(user.deletedAt)}</dd>
            </div>
          ) : null}
        </dl>
        <section className="stack">
          <h3>Location</h3>
          <p className="muted">Approximate IP location can reflect a VPN, proxy or network provider and may be inaccurate.</p>
          <dl className="admin-detail-grid">
            <div><dt>Country (IP)</dt><dd>{available(latest?.location?.country)}</dd></div>
            <div><dt>State / region (IP)</dt><dd>{available(latest?.location?.state)}</dd></div>
            <div><dt>City (IP)</dt><dd>{available(latest?.location?.city)}</dd></div>
          </dl>
          <p className="muted">Location is recorded at sign-in. A session restored from your browser does not create a new location record. SeyPrompt does not request GPS permission or store precise coordinates.</p>
        </section>
        <section className="stack">
          <h3>Device &amp; Browser</h3>
          <p className="muted">Reported information from the last retained login; it is not proof of device identity.</p>
          <dl className="admin-detail-grid">
            <div><dt>Device type</dt><dd>{available(latest?.deviceType)}</dd></div>
            <div><dt>Operating system</dt><dd>{available(latest?.os)}</dd></div>
            <div><dt>Browser</dt><dd>{available(latest?.browser)}</dd></div>
            <div><dt>Browser language</dt><dd>{available(latest?.language)}</dd></div>
            <div><dt>Timezone</dt><dd>{available(latest?.timezone)}</dd></div>
          </dl>
        </section>
        <section className="stack">
          <h3>Login Activity</h3>
          <dl className="admin-detail-grid">
            <div><dt>Successful logins observed</dt><dd>{available(user.loginCount)}</dd></div>
            <div><dt>Tracking started</dt><dd>{formatDate(user.loginTrackingStartedAt)}</dd></div>
            <div><dt>Last successful login</dt><dd>{formatDate(user.lastLoginAt)}</dd></div>
            <div><dt>Last login method</dt><dd>{available(latest?.method)}</dd></div>
            <div><dt>IP address (7-day retention)</dt><dd>{available(latest?.ip)}</dd></div>
            <div><dt>First referral domain</dt><dd>{available(user.firstReferral?.source)}</dd></div>
            {["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].map((key) => (
              <div key={key}><dt>{key}</dt><dd>{available(user.firstReferral?.[key])}</dd></div>
            ))}
          </dl>
          <p className="muted">Counts start when tracking begins; earlier login totals are unknown. History is limited to 50 events within 90 days.</p>
          {user.loginHistory?.length ? (
            <div className="admin-accordion-list">
              {user.loginHistory.map((event) => (
                <details className="admin-accordion" key={event.id}>
                  <summary>{formatDate(event.at)} · {event.method}</summary>
                  <dl className="admin-detail-grid">
                    <div><dt>Approximate IP location</dt><dd>{[event.location?.city, event.location?.state, event.location?.country].filter(Boolean).join(", ") || "Not Available"}</dd></div>
                    <div><dt>IP address</dt><dd>{available(event.ip)}</dd></div>
                    <div><dt>Device / OS / browser</dt><dd>{[event.deviceType, event.os, event.browser].filter(Boolean).join(" / ") || "Not Available"}</dd></div>
                  </dl>
                </details>
              ))}
            </div>
          ) : <p className="muted">No retained login activity. Not Available for accounts that have not logged in since tracking began.</p>}
        </section>
        <section className="admin-user-membership-panel">
          <div>
            <h3>Membership</h3>
            <p className="muted">
              {formatMembershipStatus(user.membershipDetails || user.membershipSummary, user.membershipType || "free")}
            </p>
          </div>
          <dl className="admin-detail-grid">
            <div>
              <dt>Source</dt>
              <dd>{user.membershipDetails?.source || "none"}</dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>{formatDate(user.membershipDetails?.startsAt)}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{formatDate(user.membershipDetails?.expiresAt)}</dd>
            </div>
          </dl>
        </section>
        <section className="admin-user-purchases">
          <div>
            <h3>Purchase history</h3>
            <p className="muted">Prompt purchases and membership purchases for this user.</p>
          </div>
          {user.purchaseHistory?.length ? (
            <div className="admin-accordion-list">
              {user.purchaseHistory.map((order) => (
                <details className="admin-accordion" key={order.id}>
                  <summary>
                    <span>
                      <strong>{order.itemName || formatPurchaseType(order)}</strong>
                      <small>{formatPurchaseType(order)}</small>
                    </span>
                    <span>{formatPurchaseStatus(order.status)}</span>
                  </summary>
                  <dl className="admin-detail-grid">
                    <div>
                      <dt>Amount</dt>
                      <dd>{formatCurrency(order.amount, order.currency)}</dd>
                    </div>
                    <div>
                      <dt>Paid</dt>
                      <dd>{formatDate(order.paidAt)}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{formatDate(order.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Provider payment</dt>
                      <dd>{order.providerPaymentId || order.providerOrderId || "-"}</dd>
                    </div>
                    {order.expiresAt ? (
                      <div>
                        <dt>Expires</dt>
                        <dd>{formatDate(order.expiresAt)}</dd>
                      </div>
                    ) : null}
                  </dl>
                </details>
              ))}
            </div>
          ) : (
            <p className="muted">No purchases found.</p>
          )}
        </section>
        <div className="stack">
          <AdminUserActions user={user} />
          <Link className="button-secondary" href="/admin/users">
            Back to Users
          </Link>
        </div>
      </div>
    </div>
  );
}
