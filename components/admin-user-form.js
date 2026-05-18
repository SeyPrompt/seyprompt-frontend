"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLE_OPTIONS = ["user", "admin"];
const MEMBERSHIP_OPTIONS = ["free", "pro", "premium", "enterprise"];
const STATUS_OPTIONS = ["active", "blocked", "disabled"];

function getUserId(user) {
  return user?._id || user?.id;
}

function validateUser(payload, mode) {
  if (!payload.name || payload.name.length < 2) {
    return "Name is required.";
  }

  if (!payload.email || !payload.email.includes("@")) {
    return "A valid email is required.";
  }

  if (mode === "create" && !payload.password) {
    return "Password is required for new users.";
  }

  if (payload.password && payload.password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  return "";
}

export function AdminUserForm({ mode, user }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      role: String(formData.get("role") || "user"),
      membershipType: String(formData.get("membershipType") || "free"),
      status: String(formData.get("status") || "active"),
      isEmailVerified: formData.get("isEmailVerified") === "true"
    };
    const password = String(formData.get("password") || "").trim();

    if (password) {
      payload.password = password;
    }

    const validationError = validateUser(payload, mode);

    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const endpoint =
      mode === "create" ? "/api/admin/users" : `/api/admin/users/${getUserId(user)}`;
    const method = mode === "create" ? "POST" : "PUT";

    let response;

    try {
      response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch {
      setError("Unable to save user. Please check your connection and try again.");
      setLoading(false);
      return;
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (result.details?.length) {
        setError(
          result.details
            .map((item) => (typeof item === "string" ? item : item.message))
            .filter(Boolean)
            .join(" ")
        );
      } else {
        setError(result.error || result.message || "Unable to save user.");
      }
      setLoading(false);
      return;
    }

    router.push("/admin/users");
    router.refresh();
  }

  return (
    <form className="panel form-card stack" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            maxLength={120}
            name="name"
            required
            defaultValue={user?.name || ""}
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            maxLength={160}
            name="email"
            required
            type="email"
            defaultValue={user?.email || ""}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="role">Role</label>
          <select id="role" name="role" defaultValue={user?.role || "user"}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="membershipType">Membership</label>
          <select
            id="membershipType"
            name="membershipType"
            defaultValue={user?.membershipType || "free"}
          >
            {MEMBERSHIP_OPTIONS.map((membershipType) => (
              <option key={membershipType} value={membershipType}>
                {membershipType}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={user?.status || "active"}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="isEmailVerified">Email verification</label>
          <select
            id="isEmailVerified"
            name="isEmailVerified"
            defaultValue={String(Boolean(user?.isEmailVerified))}
          >
            <option value="true">Verified</option>
            <option value="false">Not verified</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="password">
          {mode === "create" ? "Password" : "Password reset"}
        </label>
        <input
          autoComplete="new-password"
          id="password"
          minLength={6}
          name="password"
          placeholder={mode === "create" ? "" : "Leave blank to keep current password"}
          required={mode === "create"}
          type="password"
        />
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="toolbar">
        <button className="button" disabled={loading} type="submit">
          {loading ? "Saving..." : mode === "create" ? "Create User" : "Save User"}
        </button>
        <button
          className="button-secondary"
          disabled={loading}
          onClick={() => router.push("/admin/users")}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
