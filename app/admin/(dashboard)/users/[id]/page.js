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
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatBoolean(value) {
  return value ? "Yes" : "No";
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
  const user = await fetchAdminUserById(token, id).catch(() => null);

  if (!user) {
    notFound();
  }

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">User details</div>
        <h2>{user.name || user.email || "User"}</h2>
        <p className="muted">Review this account before making changes.</p>
      </div>
      <div className="panel form-card stack">
        <dl className="admin-detail-grid">
          <div>
            <dt>Name</dt>
            <dd>{user.name || "Unnamed user"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email || "No email"}</dd>
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
        <section className="admin-user-membership-panel">
          <div>
            <h3>Membership details</h3>
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
