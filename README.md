# Persona 5 Royal Companion

A fan companion for **Persona 5 Royal**: every confidant, every Shadow, every
classroom exam answer, every Persona 5 and Royal negotiation prompt, and how to
max every social stat.

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

For a one-command local preview, use the start scripts. They install missing
dependencies, run `verify`, and serve the generated site:

```bash
./start.sh           # http://localhost:8080
./start.sh 3000      # another port
start.bat            # Windows
```

---

## How it works

Everything the site serves is **generated**; everything you edit lives in
`data/`. The generated HTML is committed, because GitHub Pages deploys
straight from the branch.

```
data/                      <- you edit this; every file in here is JSON
  confidants/*.json          23 confidants, structured (abilities, schedule,
                             rank-up, gifts, bonus events)
  shadows/locations.json     palaces + mementos tables
  classroom/exams.json       every exam and its answer
  social-stats/*.json        the five stat guides, as a flat block list
  negotiation/p5.json        259 Persona 5 prompts + effect grades
  negotiation/royal.json     277 Persona 5 Royal prompts + effect grades

_build/                    <- the build itself
  build.mjs                  data/ -> HTML
  check.mjs                  the validator
  clean.mjs                  removes generated output
  serve.mjs                  local static server
  runtime/negotiation.js     hand-written client JS, copied to assets/js/
  lib/                       layout, block renderer, helpers

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

Edit the block list in `data/social-stats/<slug>.json`. A block is a heading, a
paragraph, a link list or a table. A table cell is a string, a link object
(`{label, href}` for an external link, `{label, ref}` for a sibling guide), or
an array of either — an array is a multi-line cell and is joined with `<br>` on
render. Put no markup in the data: anything resembling a tag is escaped and
shown as text, so the data can never inject HTML.

### Adding a negotiation question

Append an entry to `data/negotiation/p5.json` or
`data/negotiation/royal.json`:

```json
{
  "prompt": "…",
  "answers": [
    {
      "text": "…",
      "grades": {
        "gloomy": "OK",
        "irritable": "GOOD",
        "timid": "GOOD",
        "upbeat": "GOOD"
      },
      "notes": {
        "irritable": "GOOD / OK?"
      },
      "unconfirmed": {
        "upbeat": true
      }
    }
  ]
}
```

`grades` is the translated effect for each personality: `"BAD"`, `"OK"`,
`"GOOD"`, or `""` for no effect. `notes` and `unconfirmed` are optional and only
exist where the source reports an ambiguous or unconfirmed reaction. The runtime
shows the note text instead of the bare grade, so `"GOOD / OK?"` is displayed
exactly as written. Non-standard source values such as `"None"` are also kept in
`notes` with an empty grade.

The JSON follows the P5 Questions and Royal Questions pages in the
[Persona 5 Negotiation Guide](https://joyceychen.com/persona5-negotiation/)
by [joyce-chen](https://github.com/joyce-chen/persona5-negotiation). Keep each
source's order and duplicate prompts. Map `-` to `""`; for a compound value use
its first label in `grades` and keep the full text in `notes`; set the matching
`unconfirmed` key when the guide marks a reaction as unconfirmed.

The page defaults to Royal and has a P5/Royal selector. The search matches both
prompt text and response text within the selected version.

---

## Data sources

Negotiation questions and reactions come from the
[Persona 5 Negotiation Guide](https://joyceychen.com/persona5-negotiation/) by
[joyce-chen](https://github.com/joyce-chen/persona5-negotiation), specifically
the [P5 Questions](https://joyceychen.com/persona5-negotiation/) and
[Royal Questions](https://joyceychen.com/persona5-negotiation/royal) pages. The
guide is a work in progress and marks some reactions as unconfirmed; those flags
are preserved in both JSON files.

---

## The checker

`npm run check` is the guard rail. It fails the build if any of these regress:

- a link, stylesheet, script or image does not resolve on disk
- a path is absolute (`/...`) or points at the site's own absolute URL —
  the site must work from a domain root, a project sub-path, or `file://`
- a page is missing a `<title>`, meta description, `lang`, or its single `<h1>`
- an `<img>` is missing `width`/`height` (causes layout shift) or `alt`
- a `<table>` has no `<thead>`, or a row's cell count disagrees with its header
- negotiation data has missing prompts/answers or invalid grades/notes, or the
  P5/Royal controls are missing
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
row-for-row: all 23 confidants, 18 shadow locations (221 rows), 9 exams and the
original 195 negotiation questions are accounted for. The negotiation data now
includes the 259-question P5 set and the 277-question Royal set from the source
guide, with a selector on the page.
