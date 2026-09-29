# AGENTS.md

Static, data-driven site (Persona 5 Royal companion) deployed to GitHub Pages.
No framework, no client router, no bundler, no test runner — plain Node ESM
scripts in `_build/`.

## Commands

```bash
npm install          # only dep is node-html-parser, used by the checker
npm run build        # data/ -> HTML
npm run check        # the test suite: link/asset/structure validator
npm run verify       # clean + build + check  <- run this before every commit
npm run serve        # preview on :8080  (npm run serve -- 3000 for another port)
```

There is no `test` script and no linter/formatter. `npm run check` is the gate.

After `npm run verify`, the working tree should be clean. Generated output is
**committed** (Pages deploys straight from the branch), so if `git status` shows
modified HTML after a rebuild, the previous commit was made without rebuilding —
regenerate and commit the output.

## Generated vs. source

| Path | Status |
| --- | --- |
| `data/` | source of truth — edit this |
| `_build/runtime/*.js` | hand-written client JS, copied into `assets/js/` at build |
| `assets/css/`, `assets/img/`, `favicon.ico`, `.nojekyll` | hand-maintained |
| `index.html`, `confidants/`, `shadows/`, `classroom/`, `negotiation/`, `social-stats/` | **generated** |
| `assets/js/` (whole dir) | **generated**, deleted and rebuilt by `clean` |

Never hand-edit a generated file — `npm run clean` will delete it.

## Branch flow

- **Never commit to `dev` or `main` directly.** Cut a branch and work there.
- The 2.0 restructure lives on `refactor` only. Local `dev` is kept pinned at
  `origin/dev` (`cef2312`) as the untouched pre-2.0 baseline — do not
  fast-forward it and do not push to it.
- `main` is the live GitHub Pages source and still holds the old single-page
  site. `main` is a strict ancestor of `refactor`, so landing the 2.0 work is a
  conflict-free fast-forward, but it replaces the live site and is a deliberate
  PR decision — never something done from a local session.
- Anything not yet on `origin` exists in this clone only. A deleted repo, a
  fresh clone or a rebuilt machine loses it; say so when a branch holds
  unpushed work.

## Pushing is gated by a passphrase

`origin` is SSH (`git@github.com:...`) and `~/.ssh/id_ed25519` is
passphrase-protected. No `ssh-agent` runs in an agent session (`ssh-add -l`
reports "Could not open a connection to your authentication agent"), so
`git push` prompts for a passphrase on a terminal the agent cannot answer and
will hang or fail rather than fail fast.

- Do not run `git push` from an agent session. Prepare the branch and the commit,
  then hand the user the exact command to run themselves.
- `push.default` is unset (`simple`), so a new branch needs `--set-upstream`.
- `git fetch` authenticates over SSH too, so it hits the same passphrase. To
  learn the remote's state, read the local tracking refs instead
  (`git branch -vv`, `git rev-list --left-right --count origin/<b>...<b>`) —
  but they are only as fresh as the last fetch, so say so when it matters.
- Build, check and purely local git operations need no auth at all.

## Hard constraints the checker enforces

`npm run check` fails on all of these, so it is cheaper to satisfy them than to
debug afterwards:

- **No absolute paths.** Every href/src must be relative so the site works from
  a domain root, a project sub-path, and `file://`. In templates build with
  `link(depth, href)` from `_build/lib/layout.mjs`; never concatenate a path by
  hand. `check.mjs:71` additionally rejects any absolute URL containing
  `vonlanplace.github.io`.
- **Exactly one `<h1>` per page.** The `<h1>` is the site title emitted by
  `page()` in `_build/lib/layout.mjs:132`. Page bodies must start at `<h2>`.
- **Every `<img>` needs `width`, `height` and `alt`** (an empty `alt=""` is
  accepted). Portrait sizes are hardcoded in `build.mjs` at 125x125 for `sm/`
  and 250x250 for `md/`.
- **Every `<table>` needs a `<thead>`, and every row's cell count must match the
  header.** Use the `table()` helper in `_build/build.mjs`; it guarantees this.
- **No presentational attributes:** `border`, `align` and `onclick` are all
  rejected (`check.mjs:120`). This includes `align` on table cells — the build
  emits `class="ta-center"` instead.
- Each page needs a `<title>`, a meta description and `lang` on `<html>`.
- The 6 section `index.html` files and one page per `data/confidants/index.json`
  entry must exist.

## Page depth

Pages sit at depth 0 (site root) or depth 1 (section pages). `prefix(depth)`
yields `"./"` or `"../"`, so every new link/image must go through `link(depth, …)`.
Hand-written relative paths in a `build.mjs` body are the most common cause of a
checker failure.

## CSS load order

Order is load-bearing: `tokens.css` → `base.css` → `layout.css` →
`components.css`. It is defined once in the `CSS` array in
`_build/build.mjs:23` and passed to every `page()` call. Adding a stylesheet
means editing that array, not the HTML.

## Social stat guides

`data/social-stats/*.json` is rendered by `_build/lib/blocks.mjs` from a flat
block list. There is no markup in the data — a block is one of:

```json
{ "type": "heading",   "level": 3, "text": "Class" }
{ "type": "paragraph", "text": "..." }
{ "type": "links",     "items": [ { "label": "Guts", "ref": "guts" } ] }
{ "type": "table", "head": ["Activity", "Detail", "Gains"],
  "rows": [ ["Ordering Frui-Tea", "Will appear in July", ["- +1 Charm", "- +3 Charm"]] ] }
```

A table cell is a `string`, a link object (`{label, href}` external or
`{label, ref}` for a sibling guide), or an **array** of either. The array *is*
the line break — it is joined with `<br>` on render, so never put `<br>` in the
data. Any literal tag in a string is escaped and shown as text, so the data
cannot inject HTML.

- `ref` is a sibling slug; it renders as `<slug>.html`. All social stat pages
  are depth 1 in the same directory, so no `link(depth, …)` prefix is needed.
- `description` is an explicit field and becomes the page's
  `<meta name="description">` (truncated to 200 chars by the build) and the card
  blurb on `social-stats/index.html`. Write it as a real description.
- The old Markdown renderer escaped `<br>` instead of emitting it, so the
  pre-2.1 pages displayed 106 literal `&lt;br&gt;` strings. The block renderer
  fixes that; do not reintroduce an escape-then-passthrough allowlist.

## Negotiation questions

`data/negotiation/questions.json` is `{prompt, answers: [{text, code}]}`. The
build maps it to the `{q, a}` wire shape in `assets/js/negotiation-data.js`, so
`_build/runtime/negotiation.js` is unaffected by data-shape changes.

`code` is a string of 1–4 digits, one per personality (Gloomy, Irritable,
Timid, Upbeat), **not** zero-padded in the data. `gradeCells` in the runtime
left-pads to 4, so `"302"` means Gloomy 0, Irritable 3, Timid 0, Upbeat 2.
`0` renders as a blank cell.

## Other build quirks

- `clean.mjs` only removes the 5 section directories plus `index.html` and
  `assets/js/`. A new generated top-level directory must be added to
  `GENERATED_DIRS` in `_build/clean.mjs`, and any new hand-kept root file must be
  added to `KEEP_FILES` there or `clean` will delete it.
- Negotiation data is emitted as `window.P5_QUESTIONS` in
  `assets/js/negotiation-data.js` (not `fetch`ed) so the page works offline and
  from `file://`. `check` would also reject the `fetch` version.
- The prev/next links and the confidant grid follow the **array order** of
  `data/confidants/index.json`; the `order` field in that file is not read.
- Adding a confidant means: `data/confidants/<slug>.json`, an entry in
  `data/confidants/index.json`, and portraits at both
  `assets/img/confidants/{sm,md}/<slug>.png`.
- The build is deterministic — running it twice produces no diff. That is worth
  exploiting: snapshot `sha256sum` of the generated HTML before a data-format
  change and diff after, to prove the change altered only what you intended.
- Every file under `data/` is JSON. There is deliberately no `.md` or `.csv`
  left, and no hand-rolled parser in `_build/lib/`.
