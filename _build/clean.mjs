/**
 * Remove every generated artefact, leaving only sources.
 *
 *   npm run clean
 *
 * Data lives in data/, hand-written client JS in _build/runtime/, and
 * styles in assets/css/. Anything else at the site root is generated.
 */

import { rm, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const KEEP_DIRS = new Set([
    "data",
    "_build",
    "assets",
    "node_modules",
    ".git",
    ".vscode",
    ".github",
]);
const KEEP_FILES = new Set([
    "package.json",
    "package-lock.json",
    "README.md",
    "favicon.ico",
    ".gitignore",
    ".nojekyll",
    "CNAME",
]);

// Generated section directories (each holds a hand-written index.html only
// after a build; before a build they are safe to remove wholesale).
const GENERATED_DIRS = ["confidants", "shadows", "classroom", "negotiation", "social-stats"];

const removed = [];

for (const entry of await readdir(ROOT)) {
    const full = path.join(ROOT, entry);
    const info = await stat(full);

    if (info.isDirectory()) {
        if (KEEP_DIRS.has(entry)) continue;
        if (!GENERATED_DIRS.includes(entry)) continue;
        await rm(full, { recursive: true, force: true });
        removed.push(entry + "/");
        continue;
    }

    if (entry === "index.html" || (KEEP_FILES.has(entry) === false && entry.endsWith(".html"))) {
        await rm(full, { force: true });
        removed.push(entry);
    }
}

// assets/js is generated wholesale (runtime copied in, data emitted).
await rm(path.join(ROOT, "assets", "js"), { recursive: true, force: true });
removed.push("assets/js/");

console.log(`Removed ${removed.length} generated item(s):`);
for (const r of removed) console.log("  " + r);
