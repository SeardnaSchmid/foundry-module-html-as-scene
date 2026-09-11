#!/usr/bin/env node
/**
 * Symlinks this working copy into the local Foundry data directory, so the
 * installed module *is* the repo: edit a file, reload the browser, done.
 *
 * Counterpart to the manual `Data/systems/tno` symlink the TNO system uses.
 * Override the target with FOUNDRY_DATA_PATH.
 */

import { existsSync, lstatSync, mkdirSync, readlinkSync, symlinkSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const source = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = process.env.FOUNDRY_DATA_PATH ?? join(homedir(), ".local/share/FoundryVTT");
const modules = join(dataPath, "Data", "modules");
const target = join(modules, "html-as-scene");

if (!existsSync(dataPath)) {
  console.error(`Foundry data directory not found: ${dataPath}`);
  console.error("Set FOUNDRY_DATA_PATH if your install lives elsewhere.");
  process.exit(1);
}

mkdirSync(modules, { recursive: true });

if (existsSync(target) || lstatSync(target, { throwIfNoEntry: false })) {
  const stats = lstatSync(target);
  if (!stats.isSymbolicLink()) {
    console.error(`✗ ${target} exists and is not a symlink — refusing to touch it.`);
    process.exit(1);
  }
  if (readlinkSync(target) === source) {
    console.log(`✓ already linked: ${target} → ${source}`);
    process.exit(0);
  }
  unlinkSync(target);
}

symlinkSync(source, target, "dir");
console.log(`✓ linked ${target} → ${source}`);
