"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, Eye, Pencil, Power, RotateCcw, Trash2, UserCheck } from "lucide-react";

function getUserId(user) {
  return user?._id || user?.id;
}

function isDeletedUser(user) {
  return Boolean(user?.deletedAt || user?.isDeleted || user?.deleted || user?.status === "deleted");
}

function getStatusActions(status) {
  switch (status) {
    case "pending":
      return [
        {
          key: "activate",
          label: "Activate",
          icon: UserCheck,
          nextStatus: "active"
        }
      ];
    case "active":
      return [
        {
          key: "disable",
          label: "Disable",
          icon: Power,
          nextStatus: "disabled",
          confirmMessage: "Disable this user?"
        },
        {
          key: "block",
          label: "Block",
          icon: Ban,
          nextStatus: "blocked",
          danger: true,
          confirmMessage: "Block this user?"
        }
      ];
    case "blocked":
      return [
        {
          key: "unblock",
          label: "Unblock",
          icon: UserCheck,
          nextStatus: "active"
        }
      ];
    case "disabled":
      return [
        {
          key: "enable",
          label: "Enable",
          icon: Power,
          nextStatus: "active"
        }
      ];
    default:
      return [
        {
          key: "activate",
          label: "Activate",
          icon: UserCheck,
          nextStatus: "active"
        },
        {
          key: "block",
          label: "Block",
          icon: Ban,
          nextStatus: "blocked",
          danger: true,
          confirmMessage: "Block this user?"
        }
      ];
  }
}

export function AdminUserActions({ mode = "full", user }) {
  const router = useRouter();
  const id = getUserId(user);
  const [loadingAction, setLoadingAction] = useState("");
  const deleted = isDeletedUser(user);
  const status = String(user?.status || "pending").toLowerCase();
  const statusActions = getStatusActions(status);

  async function runAction(action, endpoint, options = {}) {
    if (!id || loadingAction) {
      return;
    }

    if (options.confirmMessage && !window.confirm(options.confirmMessage)) {
      return;
    }

    setLoadingAction(action);

    const response = await fetch(endpoint, {
      method: options.method || "PATCH",
      headers: options.body
        ? {
            "Content-Type": "application/json"
          }
        : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      window.alert(data.error || data.message || `Unable to ${action} this user.`);
      setLoadingAction("");
      return;
    }

    router.refresh();
    setLoadingAction("");
  }

  function updateStatus(action) {
    runAction(action.key, `/api/admin/users/${id}/status`, {
      body: { status: action.nextStatus },
      confirmMessage: action.confirmMessage
    });
  }

  if (!id) {
    return null;
  }

  if (mode === "compact") {
    return (
      <div className="admin-icon-actions">
        <Link
          aria-label={`View ${user?.name || user?.email || "user"}`}
          className="icon-button"
          href={`/admin/users/${id}`}
          title="View"
        >
          <Eye aria-hidden="true" size={18} />
        </Link>
        <Link
          aria-label={`Edit ${user?.name || user?.email || "user"}`}
          className="icon-button"
          href={`/admin/users/${id}/edit`}
          title="Edit"
        >
          <Pencil aria-hidden="true" size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="toolbar admin-detail-actions">
      <Link className="button-secondary compact" href={`/admin/users/${id}`}>
        <Eye aria-hidden="true" size={18} />
        View
      </Link>
      <Link className="button-secondary compact" href={`/admin/users/${id}/edit`}>
        <Pencil aria-hidden="true" size={18} />
        Edit
      </Link>
      {deleted ? (
        <button
          className="button-secondary compact"
          disabled={Boolean(loadingAction)}
          onClick={() => runAction("restore", `/api/admin/users/${id}/restore`)}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={18} />
          {loadingAction === "restore" ? "Restoring..." : "Restore"}
        </button>
      ) : (
        <>
          {statusActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                className={action.danger ? "button-danger compact" : "button-secondary compact"}
                disabled={Boolean(loadingAction)}
                key={action.key}
                onClick={() => updateStatus(action)}
                type="button"
              >
                <Icon aria-hidden="true" size={18} />
                {loadingAction === action.key ? "Saving..." : action.label}
              </button>
            );
          })}
          <button
            className="button-danger compact"
            disabled={Boolean(loadingAction)}
            onClick={() =>
              runAction("delete", `/api/admin/users/${id}`, {
                method: "DELETE",
                confirmMessage: "Soft delete this user?"
              })
            }
            type="button"
          >
            <Trash2 aria-hidden="true" size={18} />
            {loadingAction === "delete" ? "Deleting..." : "Delete"}
          </button>
        </>
      )}
    </div>
  );
}
