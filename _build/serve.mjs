/**
 * Minimal static file server for local preview.
 *
 *   npm run serve          # http://localhost:8080
 *   npm run serve -- 3000
 *
 * Serves the repository root exactly as GitHub Pages would, including the
 * directory-index behaviour, so a page that works here works in production.
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".csv": "text/csv; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        let target = path.join(ROOT, decodeURIComponent(url.pathname));

        // Never serve outside the repository.
        if (!target.startsWith(ROOT)) {
            res.writeHead(403).end("Forbidden");
            return;
        }

        let info = await stat(target).catch(() => null);
        if (info?.isDirectory()) {
            target = path.join(target, "index.html");
            info = await stat(target).catch(() => null);
        }
        if (!info?.isFile()) {
            res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
            res.end("<h1>404</h1><p>Not found: " + url.pathname + "</p>");
            return;
        }

        res.writeHead(200, {
            "content-type": TYPES[path.extname(target).toLowerCase()] ?? "application/octet-stream",
            "cache-control": "no-cache",
        });
        createReadStream(target).pipe(res);
    } catch (error) {
        res.writeHead(500).end(String(error));
    }
});

server.listen(PORT, () => {
    console.log(`Serving ${ROOT}`);
    console.log(`  http://localhost:${PORT}/`);
});

void readFile;
void existsSync;
