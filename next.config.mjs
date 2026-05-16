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
      {
        source: "/admin",
        headers: privateSeoHeaders
      },
      {
        source: "/admin/:path*",
        headers: privateSeoHeaders
      },
      {
        source: "/login",
        headers: privateSeoHeaders
      },
      {
        source: "/dashboard",
        headers: privateSeoHeaders
      }
    ];
  }
};

export default nextConfig;
