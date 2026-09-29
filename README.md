# Persona 5 Royal Companion

A fan companion for **Persona 5 Royal**: every confidant, every Shadow, every
classroom exam answer, every negotiation prompt, and how to max every social stat.

The site is static and hosted on GitHub Pages. There is no framework and no
client-side router — every page is a real HTML document at its own URL, so
everything is shareable, deep-linkable and indexable.

---

## Quick start

```bash
npm install          # one dev dependency, used only by the link checker
npm run build        # data/ -> HTML
npm run check        # validate every link, asset and page
npm run serve        # preview at http://localhost:8080
```

`npm run verify` runs clean + build + check in one go.

---

## How it works

Everything the site serves is **generated**; everything you edit lives in
`data/`. The generated HTML is committed, because GitHub Pages deploys
straight from the branch.

```
data/                      <- you edit this
  confidants/*.json          23 confidants, structured (abilities, schedule,
                             rank-up, gifts, bonus events)
  shadows/locations.json     palaces + mementos tables
  classroom/exams.json       every exam and its answer
  social-stats/*.md          the five stat guides, in Markdown
  negotiation/questions.csv  195 prompts and their effect codes
  shadows/shadow-locations-source.md
                             the original hand-written notes, kept for reference

_build/                    <- the build itself
  build.mjs                  data/ -> HTML
  check.mjs                  the validator
  clean.mjs                  removes generated output
  serve.mjs                  local static server
  runtime/negotiation.js     hand-written client JS, copied to assets/js/
  lib/                       layout, markdown renderer, helpers

assets/                    <- static, hand-maintained
  css/                       tokens, base, layout, components
  img/confidants/{sm,md}/    23 portraits at two sizes
  js/                        GENERATED - do not edit

index.html                 <- GENERATED
confidants/  shadows/  classroom/  negotiation/  social-stats/   <- GENERATED
```

**Never edit a generated file.** Change `data/`, run `npm run build`.

### Adding a confidant

1. Create `data/confidants/<slug>.json` following an existing file's shape.
2. Add an entry to `data/confidants/index.json` (this drives the grid and the
   prev/next links).
3. Drop the portrait into `assets/img/confidants/{sm,md}/<slug>.png`.
4. `npm run build && npm run check`.

### Editing a social stat guide

Just edit the Markdown in `data/social-stats/`. Tables, links, headings and
inline `<br>` are supported; anything else is escaped and shown as text.

### Adding a negotiation question

Append a row to `data/negotiation/questions.csv`:

```
prompt;response 1;code;response 2;code;response 3;code
```

The code is up to four digits — one per personality (Gloomy, Irritable, Timid,
Upbeat), left-padded with zeroes. `1` is bad, `2` neutral, `3` good. So `2333`
means "bad for Gloomy, good for the other three".

---

## The checker

`npm run check` is the guard rail. It fails the build if any of these regress:

- a link, stylesheet, script or image does not resolve on disk
- a path is absolute (`/...`) or points at the site's own absolute URL —
  the site must work from a domain root, a project sub-path, or `file://`
- a page is missing a `<title>`, meta description, `lang`, or its single `<h1>`
- an `<img>` is missing `width`/`height` (causes layout shift) or `alt`
- a `<table>` has no `<thead>`, or a row's cell count disagrees with its header
- legacy artefacts reappear: `border="1"`, `onclick=`, `<details id>`

---

## What changed in the 2.0 restructure

The site used to be a single `index.html` that `fetch()`ed four partials into
empty `<div>`s. That architecture caused a number of problems, all now fixed:

| Problem | Now |
| --- | --- |
| One URL for everything; nothing shareable or indexable | 34 real pages with their own URLs |
| Page was blank until JS ran; failed entirely on `file://` | Static HTML, works with JS disabled |
| `<base href="/persona-5-companion-site.github.io/">` locked the site to one host | Every path relative; relocatable |
| 23 portraits hardcoded to absolute `vonlanplace.github.io` URLs | Local `assets/img/`, works offline |
| Shadow data duplicated in `Persona-5-Shadows.md` and HTML, and **already drifted** | One JSON source of truth |
| 5 finished Social Stat guides unreachable from the site | Five real pages, linked everywhere |
| `style.css` declared most selectors twice (two merged halves) | Split into tokens / base / layout / components |
| `cores.css` + `style.css` both required on all 28 pages or the page broke | Four ordered stylesheets, documented order |
| Confidant picker was a 25-handler `<table>` of `onclick=` attributes | A CSS grid of real links |
| 1.0 MB `imagens/night-calendar.png` and a 63 KB banner referenced by nothing | Deleted; the banner is now the Social Stats artwork |
| `<details id>`, 18× `border="1"`, `<th>` outside `<thead>`, 3 wrong page titles, missing `<body>`, 4 different `lang` values | All fixed, and `check` prevents them returning |
| `fetch("questions.csv")` with no `.catch` | Data inlined as a script; works on `file://`, no silent failure |
| No `.gitignore`, no `.nojekyll`, `.vscode/` committed | Added |

The migration from the old hand-written HTML to `data/*.json` was verified
row-for-row: all 23 confidants, 18 shadow locations (221 rows), 9 exams and 195
negotiation questions are accounted for, with no content dropped.
