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
            <dd>{user.membershipType || "free"}</dd>
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
