export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export const apiUrl = (path = "") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // Browser pricing requests must pass through the frontend edge, where the
  // visitor country is available, before reaching the separate API host.
  if (typeof window !== "undefined" && (
    cleanPath.startsWith("/api/public/") ||
    cleanPath.startsWith("/api/payments/") ||
    cleanPath.startsWith("/api/user/prompts/")
  )) {
    return `/api/regional${cleanPath.slice(4)}`;
  }

  return `${API_BASE_URL}${cleanPath}`;
};
