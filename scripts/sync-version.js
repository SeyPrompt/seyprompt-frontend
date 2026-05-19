const { execFileSync } = require("node:child_process");
const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

const cwd = process.cwd();

const getGitTagVersion = () => {
  try {
    const raw = execFileSync("git", ["describe", "--tags", "--abbrev=0"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return raw.replace(/^v/i, "");
  } catch (_error) {
    return null;
  }
};

const syncVersion = () => {
  const version = getGitTagVersion();
  if (!version) {
    console.log("No git tag found. Skipping version sync.");
    return;
  }

  const packagePath = resolve(cwd, "package.json");
  const packageLockPath = resolve(cwd, "package-lock.json");

  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  if (packageJson.version !== version) {
    packageJson.version = version;
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
    console.log(`Updated package.json version → ${version}`);
  } else {
    console.log(`package.json version already ${version}`);
  }

  if (existsSync(packageLockPath)) {
    const lockJson = JSON.parse(readFileSync(packageLockPath, "utf8"));
    if (lockJson.version !== version) {
      lockJson.version = version;
      if (lockJson.packages?.[""]) {
        lockJson.packages[""].version = version;
      }
      writeFileSync(packageLockPath, JSON.stringify(lockJson, null, 2) + "\n", "utf8");
      console.log(`Updated package-lock.json version → ${version}`);
    } else {
      console.log(`package-lock.json version already ${version}`);
    }
  }
};

syncVersion();
