#!/usr/bin/env node
/**
 * Fail if module.json describes a module that would not load.
 *
 * Same idea as `scripts/check-css-build.mjs` in the TNO system: the manifest is
 * a committed artifact that Foundry reads directly, with no bundler in front of
 * it to notice a missing or renamed file. A broken path here is only visible
 * after installing the module in a real world — far too late in a release.
 *
 * Checked:
 *   - module.json is valid JSON and carries the required fields
 *   - every esmodule, style, language and pack path exists on disk
 *   - version matches package.json
 *   - the download URL carries the version it claims to ship
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const note = (message) => problems.push(message);

function readJson(file) {
  try {
    return JSON.parse(readFileSync(join(root, file), "utf8"));
  } catch (error) {
    console.error(`✗ ${file}: ${error.message}`);
    process.exit(1);
  }
}

const manifest = readJson("module.json");
const pkg = existsSync(join(root, "package.json")) ? readJson("package.json") : null;

/* Required fields ----------------------------------------------------- */

for (const field of ["id", "title", "version", "compatibility", "manifest", "download"]) {
  if (!manifest[field]) note(`module.json is missing "${field}"`);
}

/* Referenced files ---------------------------------------------------- */

const referenced = [
  ...(manifest.esmodules ?? []),
  ...(manifest.scripts ?? []),
  // styles may be strings or { src } objects, depending on the Foundry version
  ...(manifest.styles ?? []).map((s) => (typeof s === "string" ? s : s.src)),
  ...(manifest.languages ?? []).map((l) => l.path),
  ...(manifest.packs ?? []).map((p) => p.path),
  manifest.license,
  manifest.readme,
  manifest.changelog
].filter((p) => p && !p.startsWith("http"));

for (const path of referenced) {
  if (!existsSync(join(root, path))) note(`module.json points at a missing file: ${path}`);
}

/* Import graph -------------------------------------------------------- */
// Only the entry point's direct neighbourhood: enough to catch a renamed file,
// cheap enough to stay a plain regex instead of a parser.

for (const entry of manifest.esmodules ?? []) {
  const file = join(root, entry);
  if (!existsSync(file)) continue;
  const source = readFileSync(file, "utf8");
  for (const [, specifier] of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    if (!existsSync(resolve(dirname(file), specifier))) {
      note(`${entry} imports a missing file: ${specifier}`);
    }
  }
}

/* Versions ------------------------------------------------------------ */

if (pkg && pkg.version !== manifest.version) {
  note(`version mismatch: package.json ${pkg.version} vs module.json ${manifest.version}`);
}

if (manifest.download && !manifest.download.includes(manifest.version)) {
  note(`download URL does not carry version ${manifest.version}: ${manifest.download}`);
}

/* ---------------------------------------------------------------------- */

if (problems.length) {
  console.error("✗ module.json is not release-ready:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`✓ ${manifest.id} ${manifest.version} — manifest and referenced files are consistent`);
