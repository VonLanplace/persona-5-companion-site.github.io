/**
 * The HTML page shell.
 *
 * Every generated page goes through `page()`. Because pages live at two
 * different depths (root and one level down), asset and link prefixes are
 * computed from `depth` rather than hardcoded, which keeps the whole site
 * relocatable - it works from a domain root, a project sub-path, or a
 * local file server without any path rewriting.
 */

import { escapeHtml } from "./util.mjs";

export const SITE = {
    name: "Persona 5 Royal Companion",
    short: "P5 Companion",
    description:
        "Companion guides for Persona 5 Royal: confidant ranks and gift guides, " +
        "shadow locations, classroom exam answers, negotiation questions and " +
        "social stat maximising.",
};

const NAV = [
    { href: "", label: "Home" },
    { href: "confidants/", label: "Confidants" },
    { href: "shadows/", label: "Shadows" },
    { href: "classroom/", label: "Classroom" },
    { href: "negotiation/", label: "Negotiation" },
    { href: "social-stats/", label: "Social Stats" },
];

/** Root-relative-free prefix for a page at the given depth (0 = site root). */
export function prefix(depth) {
    return depth === 0 ? "./" : "../".repeat(depth);
}

/** Resolve a site-root-relative href ("confidants/priestess.html") for a page. */
export function link(depth, href) {
    if (!href) return prefix(depth);
    return prefix(depth) + href;
}

/**
 * @param {object} opts
 * @param {string} opts.title       Page title (without the site suffix)
 * @param {string} [opts.description]
 * @param {number} [opts.depth]     0 for the site root, 1 for section pages
 * @param {string} [opts.current]   Nav key to mark as the current page
 * @param {Array<{href:string,label:string}>} [opts.breadcrumbs]
 * @param {string} opts.body        Pre-rendered page content
 * @param {Array<{href:string,label:string,external?:boolean}>} [opts.head]
 * @param {Array<{src:string,type?:string}>} [opts.scripts]
 */
export function page(opts) {
    const {
        title,
        description = SITE.description,
        depth = 1,
        current,
        breadcrumbs = [],
        body,
        head = [],
        scripts = [],
        canonical,
    } = opts;

    const p = prefix(depth);
    const fullTitle = title ? `${title} \u00b7 ${SITE.name}` : SITE.name;

    const nav = NAV.map((item) => {
        const active = item.href.replace(/\/$/, "") === (current ?? "").replace(/\/$/, "");
        const cls = active ? ' aria-current="page"' : "";
        return `<a href="${escapeHtml(link(depth, item.href))}"${cls}>${escapeHtml(item.label)}</a>`;
    }).join("\n          ");

    const crumbs = breadcrumbs.length
        ? `<nav class="breadcrumbs" aria-label="Breadcrumb">` +
          breadcrumbs
              .map((c, i) =>
                  i === breadcrumbs.length - 1
                      ? `<span aria-current="page">${escapeHtml(c.label)}</span>`
                      : `<a href="${escapeHtml(link(depth, c.href))}">${escapeHtml(c.label)}</a>`,
              )
              .join(" \u203a ") +
          `</nav>`
        : "";

    const headLinks = head
        .map(
            (h) =>
                `<link rel="stylesheet" href="${escapeHtml(link(depth, h.href))}"${
                    h.title ? ` data-layer="${escapeHtml(h.title)}"` : ""
                } />`,
        )
        .join("\n    ");

    const scriptTags = scripts
        .map(
            (s) =>
                `<script src="${escapeHtml(link(depth, s.src))}"${
                    s.defer ? " defer" : ""
                }></script>`,
        )
        .join("\n  ");

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(fullTitle)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="icon" type="image/x-icon" href="${escapeHtml(link(depth, "favicon.ico"))}" />${
        canonical
            ? `\n    <link rel="canonical" href="${escapeHtml(canonical)}" />`
            : ""
    }
    <meta property="og:title" content="${escapeHtml(fullTitle)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;600&display=swap"
    />
    ${headLinks}
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="wrap">
      <header class="site-header">
        <h1 class="site-title"><a class="site-title-link" href="${escapeHtml(link(depth, ""))}">${escapeHtml(SITE.name)}</a></h1>
        <nav class="site-nav" aria-label="Main">
          ${nav}
        </nav>
      </header>

      <main id="main">
        ${crumbs}
        ${body}
      </main>

      <footer class="site-footer">
        <p>
          Fan-made companion for <em>Persona 5 Royal</em>. Not affiliated with or endorsed by ATLUS.
          Game data &copy; ATLUS / SEGA.
        </p>
      </footer>
    </div>
  ${scriptTags}
  </body>
</html>
`;
}
