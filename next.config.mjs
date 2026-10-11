import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getGitTagVersion() {
  try {
    return execSync("git describe --tags --abbrev=0", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"]
    }).toString().trim();
  } catch (_error) {
    try {
      execSync("git fetch --tags --force", {
        cwd: __dirname,
        stdio: "ignore"
      });

      return execSync("git describe --tags --abbrev=0", {
        cwd: __dirname,
        stdio: ["ignore", "pipe", "ignore"]
      }).toString().trim();
    } catch (_fetchError) {
      return null;
    }
  }
}

function getAppVersion() {
  const gitTagVersion = getGitTagVersion();

  if (gitTagVersion) {
    return gitTagVersion;
  }

  if (process.env.NEXT_PUBLIC_APP_VERSION) {
    return process.env.NEXT_PUBLIC_APP_VERSION;
  }

  const packageJson = JSON.parse(readFileSync(path.join(__dirname, "package.json"), "utf8"));
  return packageJson.version;
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
      "/orders",
      "/orders/:path*",
      "/profile",
      "/profile/:path*",
      "/saved",
      "/saved-prompts",
      "/unlocked-prompts",
      "/unlocked-prompts/:path*"
    ].map((source) => ({
      source,
      headers: privateSeoHeaders
    }));
  }
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT || "seyprompt-frontend",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  disableLogger: true,
});
