import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

const ALLOWED_ADVISORY = 1112030;
const ALLOWED_PACKAGES = new Set([
  "@terra-money/react-base-components",
  "@terra-money/terra.js",
  "bip32",
  "browserify-sign",
  "create-ecdh",
  "crypto-browserify",
  "elliptic",
  "secp256k1",
  "tiny-secp256k1"
]);
const FORBIDDEN_TERRA_APIS = [
  "MnemonicKey",
  "RawKey",
  "Wallet",
  "createAndSignTx",
  "signBytes"
];

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this check through npm run audit:prod");

const result = spawnSync(
  process.execPath,
  [npmCli, "audit", "--omit=dev", "--json"],
  { encoding: "utf8" }
);
const audit = JSON.parse(result.stdout || "{}");
const vulnerabilities = audit.vulnerabilities ?? {};
const unexpected = [];

const validatePackage = (name, trail = new Set()) => {
  if (trail.has(name)) return;
  trail.add(name);
  const vulnerability = vulnerabilities[name];
  if (!vulnerability || !ALLOWED_PACKAGES.has(name)) {
    unexpected.push(name);
    return;
  }

  for (const via of vulnerability.via ?? []) {
    if (typeof via === "string") {
      validatePackage(via, trail);
    } else if (via.source !== ALLOWED_ADVISORY) {
      unexpected.push(`${name}:${via.source}`);
    }
  }
};

Object.keys(vulnerabilities).forEach(name => validatePackage(name));

const sourceFiles = [];
const collectSourceFiles = directory => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collectSourceFiles(path);
    else if ([".ts", ".tsx"].includes(extname(entry.name)))
      sourceFiles.push(path);
  }
};
collectSourceFiles("src");

for (const path of sourceFiles) {
  const source = readFileSync(path, "utf8");
  if (!source.includes("@terra-money/terra.js")) continue;
  for (const api of FORBIDDEN_TERRA_APIS) {
    if (new RegExp(`\\b${api}\\b`).test(source)) {
      unexpected.push(`${path}:forbidden-${api}`);
    }
  }
}

if (unexpected.length) {
  console.error("Production dependency audit found unreviewed risk:");
  unexpected.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

const count = Object.keys(vulnerabilities).length;
console.log(
  count
    ? `Production audit passed: 0 unreviewed advisories; GHSA-848j-6mx2-7j84 is isolated to ${count} approved read-only dependencies.`
    : "Production audit passed: 0 vulnerabilities."
);
