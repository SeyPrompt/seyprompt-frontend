import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  outputFileTracingRoot: __dirname,
  async headers() {
    const privateSeoHeaders = [
      {
        key: "X-Robots-Tag",
        value: "noindex, nofollow"
      }
    ];

    return [
      "/admin",
      "/admin/:path*",
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
      "/dashboard",
      "/dashboard/:path*",
      "/profile",
      "/profile/:path*",
      "/saved",
      "/saved-prompts"
    ].map((source) => ({
      source,
      headers: privateSeoHeaders
    }));
  }
};

export default nextConfig;
