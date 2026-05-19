import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAppVersion() {
  if (process.env.NEXT_PUBLIC_APP_VERSION) {
    return process.env.NEXT_PUBLIC_APP_VERSION;
  }

  try {
    return execSync("git describe --tags --abbrev=0", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"]
    }).toString().trim();
  } catch (_error) {
    const packageJson = JSON.parse(readFileSync(path.join(__dirname, "package.json"), "utf8"));
    return packageJson.version;
  }
}

const appVersion = getAppVersion();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion
  },
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
