import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const sourcePath = join(root, "src/index.ts");
const source = readFileSync(sourcePath, "utf8");
const versionPattern = /(meta:\s*{\s*name:\s*"eslint-plugin-is-kit",\s*version:\s*")([^"]+)(")/;
const match = source.match(versionPattern);

assert(match, "Could not find the plugin metadata version in src/index.ts");

const packageVersion = packageJson.version;
const sourceVersion = match[2];
const checkOnly = process.argv.includes("--check");

if (sourceVersion === packageVersion) {
  console.log(`Plugin metadata version matches package.json: ${packageVersion}`);
  process.exit(0);
}

if (checkOnly) {
  throw new Error(
    `Plugin metadata version ${sourceVersion} does not match package.json version ${packageVersion}`,
  );
}

writeFileSync(sourcePath, source.replace(versionPattern, `$1${packageVersion}$3`));
console.log(`Updated plugin metadata version from ${sourceVersion} to ${packageVersion}`);
