import packageJson from "@/package.json";

const rawAppVersion = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version;

export const appVersion = rawAppVersion.replace(/^v/i, "");
export const appVersionLabel = rawAppVersion.toLowerCase().startsWith("v")
  ? rawAppVersion
  : `v${rawAppVersion}`;
