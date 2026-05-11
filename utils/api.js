export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export const apiUrl = (path = "") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
