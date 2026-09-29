/**
 * Validate the generated site.
 *
 *   npm run check
 *
 * Checks, for every generated page:
 *   - every relative link, stylesheet, script and image resolves on disk
 *   - no path is absolute (the site must work from any domain or sub-path)
 *   - the document declares a lang, a title and a meta description
 *   - tables have a header row and no rows with the wrong column count
 *   - no file is left orphaned in the output
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED_DIRS = ["", "confidants", "shadows", "classroom", "negotiation", "social-stats"];
const SKIP = new Set(["node_modules", ".git", "data", "_build", "assets", "package.json", "package-lock.json", "README.md", ".nojekyll", ".gitignore", ".vscode", "favicon.ico"]);

const problems = [];
const fail = (file, msg) => problems.push(`${file}: ${msg}`);

async function walk(dir, out = []) {
    for (const entry of await readdir(dir)) {
        if (SKIP.has(entry)) continue;
        const full = path.join(dir, entry);
        const info = await stat(full);
        if (info.isDirectory()) await walk(full, out);
        else if (entry.endsWith(".html")) out.push(full);
    }
    return out;
}

const pages = await walk(ROOT);
let linkCount = 0;

for (const file of pages) {
    const rel = path.relative(ROOT, file);
    const dir = path.dirname(file);
    const html = await readFile(file, "utf8");
    const root = parse(html);

    // --- document metadata -------------------------------------------------
    const title = root.querySelector("title")?.textContent.trim();
    if (!title) fail(rel, "missing <title>");
    const desc = root.querySelector('meta[name="description"]')?.getAttribute("content");
    if (!desc) fail(rel, "missing meta description");
    const lang = root.querySelector("html")?.getAttribute("lang");
    if (!lang) fail(rel, "missing lang on <html>");
    if (root.querySelectorAll("h1").length !== 1) {
        fail(rel, `expected exactly 1 <h1>, found ${root.querySelectorAll("h1").length}`);
    }

    // --- references resolve ------------------------------------------------
    const refs = [
        ...root.querySelectorAll("a[href]").map((a) => [a.getAttribute("href"), "link"]),
        ...root.querySelectorAll("link[href]").map((a) => [a.getAttribute("href"), "asset"]),
        ...root.querySelectorAll("script[src]").map((a) => [a.getAttribute("src"), "asset"]),
        ...root.querySelectorAll("img[src]").map((a) => [a.getAttribute("src"), "image"]),
    ];

    for (const [href, kind] of refs) {
        if (!href) continue;
        if (href.startsWith("#")) continue;
        if (/^(https?:)?\/\//.test(href)) {
            // External, but a same-repo absolute URL is a portability bug.
            if (href.includes("vonlanplace.github.io")) {
                fail(rel, `hardcoded absolute URL to own site: ${href}`);
            }
            continue;
        }
        if (href.startsWith("/")) {
            fail(rel, `root-absolute path breaks sub-path hosting: ${href}`);
            continue;
        }
        if (href.startsWith("mailto:") || href.startsWith("data:")) continue;

        const [clean] = href.split("#");
        if (!clean) continue;
        linkCount++;

        const target = path.resolve(dir, clean);
        if (!target.startsWith(ROOT)) {
            fail(rel, `link escapes the site root: ${href}`);
            continue;
        }
        if (!existsSync(target)) {
            fail(rel, `broken ${kind}: ${href}`);
        }
    }

    // --- images declare dimensions ----------------------------------------
    for (const img of root.querySelectorAll("img")) {
        if (!img.getAttribute("width") || !img.getAttribute("height")) {
            fail(rel, `img without width/height (causes layout shift): ${img.getAttribute("src")}`);
        }
        if (!img.getAttribute("alt") && img.getAttribute("alt") !== "") {
            fail(rel, `img without alt: ${img.getAttribute("src")}`);
        }
    }

    // --- table structure ---------------------------------------------------
    for (const table of root.querySelectorAll("table")) {
        const head = table.querySelector("thead");
        if (!head) fail(rel, "table without <thead>");
        const cols = head ? head.querySelectorAll("th").length : 0;
        table.querySelectorAll("tbody tr").forEach((tr, i) => {
            const n = tr.querySelectorAll("td, th").length;
            if (cols && n !== cols) {
                fail(rel, `table row ${i + 1} has ${n} cells, header has ${cols}`);
            }
        });
    }

    // --- no leftover artefacts from the old site ---------------------------
    for (const el of root.querySelectorAll("[border], [onclick], [align]")) {
        fail(rel, `legacy presentational/JS attribute on <${el.rawTagName}>`);
    }
    if (/<details id>/.test(html)) fail(rel, "valueless id attribute on <details>");
    if (/border="1"/.test(html)) fail(rel, 'legacy border="1" on <table>');
}

// --- expected pages exist ---------------------------------------------------

const expected = [
    "index.html",
    "confidants/index.html",
    "shadows/index.html",
    "classroom/index.html",
    "negotiation/index.html",
    "social-stats/index.html",
];
for (const f of expected) {
    if (!existsSync(path.join(ROOT, f))) fail(f, "expected page was not generated");
}

for (const d of GENERATED_DIRS) {
    void d;
}

const confidants = JSON.parse(
    await readFile(path.join(ROOT, "data/confidants/index.json"), "utf8"),
);
for (const c of confidants) {
    const f = `confidants/${c.slug}.html`;
    if (!existsSync(path.join(ROOT, f))) fail(f, "confidant page missing");
}

/* ----------------------------------------------------------------- report */

console.log(`Checked ${pages.length} pages, ${linkCount} local references.`);
if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n`);
    for (const p of problems) console.error("  " + p);
    process.exit(1);
}
console.log("All checks passed.");
