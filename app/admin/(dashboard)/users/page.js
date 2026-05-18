import Link from "next/link";
import { fetchAdminUsers } from "@/lib/api";
import { requireAdminToken } from "@/lib/auth";
import { AdminUserActions } from "@/components/admin-user-actions";

export const metadata = {
  title: "Admin Users",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

const ROLE_OPTIONS = ["user", "admin"];
const STATUS_OPTIONS = ["active", "pending", "blocked", "disabled"];
const SORT_OPTIONS = [
  "name",
  "email",
  "role",
  "membershipType",
  "status",
  "isEmailVerified",
  "createdByAdmin",
  "lastLoginAt",
  "createdAt"
];
const LIMIT_OPTIONS = ["10", "20", "50", "100"];

function getUserId(user) {
  return user?._id || user?.id;
}

function formatBoolean(value, trueLabel = "Yes", falseLabel = "No") {
  return value ? trueLabel : falseLabel;
}

function getBadgeClass(type, value) {
  const normalized = String(value || "").toLowerCase();

  if (type === "status") {
    if (normalized === "active") {
      return "status-badge status-badge-success";
    }

    if (normalized === "blocked" || normalized === "disabled" || normalized === "deleted") {
      return "status-badge status-badge-danger";
    }
  }

  if (type === "verification") {
    return value
      ? "status-badge status-badge-success"
      : "status-badge status-badge-muted";
  }

  return "status-badge";
}

function buildHref(params, updates) {
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      nextParams.set(key, String(value));
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null || value === "") {
      nextParams.delete(key);
    } else {
      nextParams.set(key, String(value));
    }
  }

  const query = nextParams.toString();
  return `/admin/users${query ? `?${query}` : ""}`;
}

export default async function AdminUsersPage({ searchParams }) {
  const token = await requireAdminToken();
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q || "";
  const role = resolvedSearchParams?.role || "";
  const status = resolvedSearchParams?.status || "";
  const includeDeleted = resolvedSearchParams?.includeDeleted === "true";
  const page = String(Math.max(Number(resolvedSearchParams?.page || 1), 1));
  const limit = LIMIT_OPTIONS.includes(String(resolvedSearchParams?.limit))
    ? String(resolvedSearchParams?.limit)
    : "20";
  const sortBy = SORT_OPTIONS.includes(String(resolvedSearchParams?.sortBy))
    ? String(resolvedSearchParams?.sortBy)
    : "createdAt";
  const sortOrder = resolvedSearchParams?.sortOrder === "asc" ? "asc" : "desc";

  const params = {
    q,
    role,
    status,
    includeDeleted: includeDeleted ? "true" : "",
    page,
    limit,
    sortBy,
    sortOrder
  };

  const response = await fetchAdminUsers(token, params).catch(() => ({
    data: [],
    pagination: { total: 0, page: Number(page), limit: Number(limit), pages: 1 }
  }));
  const pagination = response.pagination || {};
  const currentPage = Number(pagination.page || page || 1);
  const totalPages = Math.max(Number(pagination.pages || 1), 1);

  return (
    <div className="stack">
      <form className="admin-toolbar" method="get">
        <input defaultValue={q} name="q" placeholder="Search name or email..." />
        <select defaultValue={role} name="role">
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption}
            </option>
          ))}
        </select>
        <select defaultValue={status} name="status">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {statusOption}
            </option>
          ))}
        </select>
        <input name="sortBy" type="hidden" value={sortBy} />
        <input name="sortOrder" type="hidden" value={sortOrder} />
        <input name="limit" type="hidden" value={limit} />
        <label className="admin-checkbox">
          <input
            defaultChecked={includeDeleted}
            name="includeDeleted"
            type="checkbox"
            value="true"
          />
          Include deleted
        </label>
        <button className="button" type="submit">
          Filter
        </button>
        <Link className="button" href="/admin/users/new">
          Add User
        </Link>
      </form>

      <div className="panel form-card">
        <div className="section-header">
          <div>
            <strong>{pagination.total || 0}</strong>{" "}
            <span className="muted">user records</span>
          </div>
        </div>

        {response.data?.length ? (
          <>
            <div className="table-wrap">
              <table className="table admin-users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Membership</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {response.data.map((user) => (
                    <tr key={getUserId(user)}>
                      <td>
                        <strong>{user.name || "Unnamed user"}</strong>
                      </td>
                      <td>{user.email || "No email"}</td>
                      <td>
                        <span className="pill">{user.role || "user"}</span>
                      </td>
                      <td>{user.membershipType || "free"}</td>
                      <td>
                        <span className={getBadgeClass("status", user.status)}>
                          {user.status || "active"}
                        </span>
                      </td>
                      <td>
                        <span className={getBadgeClass("verification", user.isEmailVerified)}>
                          {formatBoolean(user.isEmailVerified, "Verified", "Not verified")}
                        </span>
                      </td>
                      <td>
                        <AdminUserActions mode="compact" user={user} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-card-list">
              {response.data.map((user) => (
                <article className="admin-prompt-card" key={getUserId(user)}>
                  <div>
                    <strong>{user.name || "Unnamed user"}</strong>
                    <p className="muted">{user.email || "No email"}</p>
                  </div>
                  <div className="admin-card-meta">
                    <span>{user.role || "user"}</span>
                    <span>{user.membershipType || "free"}</span>
                    <span className={getBadgeClass("status", user.status)}>
                      {user.status || "active"}
                    </span>
                    <span className={getBadgeClass("verification", user.isEmailVerified)}>
                      {formatBoolean(user.isEmailVerified, "Verified", "Not verified")}
                    </span>
                  </div>
                  <AdminUserActions mode="compact" user={user} />
                </article>
              ))}
            </div>
            <div className="admin-pagination">
              <Link
                aria-disabled={currentPage <= 1}
                className="button-secondary compact"
                href={buildHref(params, { page: Math.max(currentPage - 1, 1) })}
              >
                Previous
              </Link>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Link
                aria-disabled={currentPage >= totalPages}
                className="button-secondary compact"
                href={buildHref(params, { page: Math.min(currentPage + 1, totalPages) })}
              >
                Next
              </Link>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>No users found</h3>
            <p className="muted">Create a user or broaden the filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
