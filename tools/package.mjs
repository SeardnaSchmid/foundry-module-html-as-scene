#!/usr/bin/env node
/**
 * Builds `module.zip` locally — the same archive the release workflow builds,
 * so a package can be tested in Foundry before a tag exists.
 *
 * The authoritative release path is .github/workflows/release.yml; keep the
 * file list here in step with it.
 */

import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Everything that goes into the zip, relative to the module root.
 * `dist/` is optional: the CI build ships no page of its own, but a locally
 * placed `dist/index.html` (e.g. a built orbital map) is packed along.
 */
const CONTENTS = [
  "module.json",
  "scripts",
  "styles",
  "templates",
  "lang",
  "dist",
  "LICENSE",
  "README.md",
  "CHANGELOG.md"
];

const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: "inherit" });

run("node", ["tools/check-manifest.mjs"]);

rmSync(join(root, "module.zip"), { force: true });
run("zip", ["-r", "module.zip", ...CONTENTS.filter((p) => existsSync(join(root, p)))]);

console.log("✓ module.zip written");
