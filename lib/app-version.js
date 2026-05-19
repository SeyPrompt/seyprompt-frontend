import packageJson from "@/package.json";
import { execFileSync } from "node:child_process";
import path from "node:path";

const getGitTagVersion = () => {
  try {
    return execFileSync("git", ["describe", "--tags", "--abbrev=0"], {
      cwd: path.resolve(process.cwd()),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch (_error) {
    return null;
  }
};

const rawAppVersion = getGitTagVersion() || packageJson.version;

export const appVersion = rawAppVersion.replace(/^v/i, "");
export const appVersionLabel = rawAppVersion.toLowerCase().startsWith("v")
  ? rawAppVersion
  : `v${rawAppVersion}`;
