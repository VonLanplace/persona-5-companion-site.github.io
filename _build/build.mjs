/**
 * Build: data/ -> static HTML.
 *
 *   npm run build
 *
 * Everything under data/ is the source of truth; everything the site serves
 * is generated. Running the build twice must produce identical output.
 */

import { readFile, writeFile, readdir, mkdir, rm, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { page, link, prefix, SITE } from "./lib/layout.mjs";
import { renderBlocks } from "./lib/blocks.mjs";
import { escapeHtml, tidyCell } from "./lib/util.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const OUT = ROOT;

const CSS = [
    { href: "assets/css/tokens.css" },
    { href: "assets/css/base.css" },
    { href: "assets/css/layout.css" },
    { href: "assets/css/components.css" },
];

const readJson = async (rel) => JSON.parse(await readFile(path.join(DATA, rel), "utf8"));

const write = async (rel, contents) => {
    const dest = path.join(OUT, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, contents);
    return rel;
};

/* ------------------------------------------------------------- renderers */

function table({ head, rows }) {
    if (!rows || !rows.length) return "";
    const thead = head?.length
        ? `<thead><tr>${head.map((h) => `<th>${tidyCell(h)}</th>`).join("")}</tr></thead>`
        : "";
    const body = rows
        .map((r) => `<tr>${r.map((c) => `<td>${tidyCell(c)}</td>`).join("")}</tr>`)
        .join("");
    return `<div class="table-wrap"><table>${thead}<tbody>${body}</tbody></table></div>`;
}

function bonusEvents(section) {
    const out = [];
    for (const block of section.blocks ?? []) {
        if (block.type === "intro") {
            out.push(`<p>${tidyCell(block.html)}</p>`);
        } else if (block.type === "table") {
            out.push(table(block));
        } else {
            const items = (block.items ?? [])
                .map((item) => {
                    if (item.kind === "note") return `<li class="is-note">${tidyCell(item.text)}</li>`;
                    if (item.text === "") return `<li class="is-blank" aria-hidden="true"></li>`;
                    return `<li>${tidyCell(item.text)}</li>`;
                })
                .join("");
            out.push(
                `<div class="event"><h3>${tidyCell(block.heading)}</h3><ul class="choice-list">${items}</ul></div>`,
            );
        }
    }
    return out.length ? `<div class="events">\n${out.join("\n")}\n</div>` : "";
}

function schedule(section) {
    const items = section.items
        .map(
            (item) =>
                `<li>${
                    item.label
                        ? `<span class="schedule-label">${escapeHtml(item.label)}</span>`
                        : ""
                }<span>${item.value}</span></li>`,
        )
        .join("");
    return `<ul class="schedule">${items}</ul>`;
}

function sectionBlock(section) {
    const title = escapeHtml(section.title || section.id);
    let body = "";
    if (section.kind === "table") {
        body = (section.note ? `<p>${escapeHtml(section.note)}</p>` : "") + table(section);
    } else if (section.kind === "schedule") {
        body = schedule(section);
    } else if (section.kind === "bonus-events") {
        body = bonusEvents(section);
    } else {
        body = section.html ?? "";
    }
    return `<details>\n<summary>${title}</summary>\n${body}\n</details>`;
}

/* ------------------------------------------------------------- confidants */

async function buildConfidants() {
    const index = await readJson("confidants/index.json");
    const written = [];

    written.push(
        await write(
            "confidants/index.html",
            page({
                title: "Confidants",
                description:
                    "Every Persona 5 Royal confidant: abilities by rank, hangout " +
                    "schedules, rank-up dialogue choices, gift guides and bonus events.",
                depth: 1,
                current: "confidants",
                head: CSS,
                body: `<h2>Confidants</h2>
        <p class="page-intro">Pick a confidant to see their abilities, how to rank
        them up, their gift guide, and the events that reward bonus points.</p>
        ${arcanaGrid(index)}`,
            }),
        ),
    );

    for (const meta of index) {
        const c = await readJson(`confidants/${meta.slug}.json`);
        const i = index.findIndex((x) => x.slug === meta.slug);
        const prev = index[i - 1];
        const next = index[i + 1];

        const body = `<article>
        <h2>${escapeHtml(c.arcana)} <span aria-hidden="true">&mdash;</span> ${escapeHtml(c.numeral)}</h2>
        <img class="portrait" src="${escapeHtml(
            link(1, `assets/img/confidants/md/${c.slug}.png`),
        )}" alt="Portrait of ${escapeHtml(c.person)}" width="250" height="250" />
        <p class="person-name">${escapeHtml(c.person)}</p>
        ${c.sections.map(sectionBlock).join("\n        ")}
      </article>
      <nav class="page-nav" aria-label="Other confidants">
        ${
            prev
                ? `<a href="${escapeHtml(link(1, `confidants/${prev.slug}.html`))}"><span>Previous</span>${escapeHtml(
                      prev.arcana,
                  )}</a>`
                : `<span class="is-empty"></span>`
        }
        <a href="${escapeHtml(link(1, "confidants/"))}"><span>All</span>Confidants</a>
        ${
            next
                ? `<a href="${escapeHtml(link(1, `confidants/${next.slug}.html`))}"><span>Next</span>${escapeHtml(
                      next.arcana,
                  )}</a>`
                : `<span class="is-empty"></span>`
        }
      </nav>`;

        written.push(
            await write(
                `confidants/${c.slug}.html`,
                page({
                    title: `${c.arcana} (${c.numeral}) - ${c.person}`,
                    description: `${c.person} confidant guide for Persona 5 Royal: ` +
                        "rank abilities, hangout schedule, rank-up dialogue choices, " +
                        "gift guide and bonus events.",
                    depth: 1,
                    current: "confidants",
                    breadcrumbs: [
                        { href: "", label: "Home" },
                        { href: "confidants/", label: "Confidants" },
                        { label: c.arcana },
                    ],
                    head: CSS,
                    body,
                }),
            ),
        );
    }

    return written;
}

function arcanaGrid(index) {
    const cards = index
        .map(
            (c) => `        <li><a class="card" href="${escapeHtml(
                link(1, `confidants/${c.slug}.html`),
            )}">
          <img src="${escapeHtml(
              link(1, `assets/img/confidants/sm/${c.slug}.png`),
          )}" alt="${escapeHtml(c.person)}" width="125" height="125" loading="lazy" />
          <span class="card-body">${escapeHtml(c.arcana)}<small>${escapeHtml(
              c.person,
          )}</small></span>
        </a></li>`,
        )
        .join("\n");
    return `<ul class="card-grid">\n${cards}\n      </ul>`;
}

/* ---------------------------------------------------------------- shadows */

async function buildShadows() {
    const data = await readJson("shadows/locations.json");

    const group = (g) => `      <details>
        <summary>${escapeHtml(g.title)}</summary>
        <div class="inner-details">
${g.locations
    .map(
        (l) => `          <details>
            <summary>${escapeHtml(l.title)}${
                l.royal ? ' <span class="badge badge--royal">Royal</span>' : ""
            }</summary>
${table(l)}
          </details>`,
    )
    .join("\n")}
        </div>
      </details>`;

    const body = `<h2>Shadow Locations</h2>
      <p class="page-intro">Where to find every Shadow in Persona 5 Royal, by
      location, with the Persona it carries, its Arcana, personality and weaknesses.</p>
${data.groups.map(group).join("\n")}
      <p class="page-intro">Missing a Shadow? <a href="https://gamefaqs.gamespot.com/faqs/73687/746862" target="_blank" rel="noopener noreferrer">Check the GameFAQs text guide</a>.</p>`;

    return [
        await write(
            "shadows/index.html",
            page({
                title: "Shadow Locations",
                description:
                    "Complete Persona 5 Royal Shadow location list for every palace " +
                    "and Mementos floor, including Persona, Arcana, personality and weaknesses.",
                depth: 1,
                current: "shadows",
                head: CSS,
                body,
            }),
        ),
    ];
}

/* -------------------------------------------------------------- classroom */

async function buildClassroom() {
    const data = await readJson("classroom/exams.json");

    const body = `<h2>Classroom Answers</h2>
      <p class="page-intro">Every classroom exam answer for Persona 5 Royal, with
      the date it is available and the best dialogue choice.</p>
${data.exams
    .map(
        (e) => `      <details>
        <summary>${escapeHtml(e.title)}</summary>
${e.tables.map(table).join("\n")}
      </details>`,
    )
    .join("\n")}`;

    return [
        await write(
            "classroom/index.html",
            page({
                title: "Classroom Exam Answers",
                description:
                    "Every Persona 5 Royal classroom exam answer, listed by exam with " +
                    "the date it unlocks and the highest-scoring response.",
                depth: 1,
                current: "classroom",
                head: CSS,
                body,
            }),
        ),
    ];
}

/* ------------------------------------------------------------- negotiation */

/**
 * Source JSON is `{prompt, answers}`; the runtime reads `{q, a}`. The mapping
 * is kept here so the hand-written client JS in _build/runtime/ never has to
 * change when the data shape does.
 */
function wireQuestions(questions) {
    return questions.map((question) => ({
        q: question.prompt,
        a: question.answers.map((answer) => ({ text: answer.text, code: answer.code })),
    }));
}

async function buildNegotiation() {
    const questions = wireQuestions(await readJson("negotiation/questions.json"));

    // Emitted as a plain script (not a fetch) so the page also works from
    // file:// and never shows a blank result list on a cold cache.
    await write(
        "assets/js/negotiation-data.js",
        "/* Generated by _build/build.mjs from data/negotiation/questions.json - do not edit. */\n" +
            `window.P5_QUESTIONS = ${JSON.stringify(questions)};\n`,
    );

    const body = `<h2>Negotiation Questions</h2>
      <p class="page-intro">Search every negotiation prompt in Persona 5 Royal and see
      how each response affects Gloomy, Irritable, Timid and Upbeat.</p>

      <form class="search-form" id="search-form" role="search">
        <div class="form-row">
          <label class="visually-hidden" for="question-ref">Search negotiation questions</label>
          <input type="search" id="question-ref" name="q" placeholder="Search questions&hellip;" autocomplete="off" />
          <button type="submit">Search</button>
          <button type="button" id="clear-btn">Clear</button>
        </div>
        <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
      </form>

      <div id="results"></div>`;

    return [
        await write(
            "negotiation/index.html",
            page({
                title: "Negotiation Questions",
                description:
                    "Search all Persona 5 Royal negotiation questions and see the " +
                    "Gloomy, Irritable, Timid and Upbeat effect of every response.",
                depth: 1,
                current: "negotiation",
                head: CSS,
                scripts: [{ src: "assets/js/negotiation.js", defer: true }],
                body,
            }),
        ),
        "assets/js/negotiation-data.js",
    ];
}

/* ------------------------------------------------------------ social stats */

async function buildSocialStats() {
    const files = (await readdir(path.join(DATA, "social-stats"))).filter((f) =>
        f.endsWith(".json"),
    );
    const written = [];
    const meta = [];

    for (const file of files) {
        const doc = await readJson(`social-stats/${file}`);
        meta.push({ ...doc, description: doc.description.slice(0, 200) });
    }
    meta.sort((a, b) => a.label.localeCompare(b.label));

    written.push(
        await write(
            "social-stats/index.html",
            page({
                title: "Social Stats",
                description:
                    "How to maximise Charm, Guts, Kindness, Knowledge and Proficiency " +
                    "in Persona 5 Royal, including every repeatable source of points.",
                depth: 1,
                current: "social-stats",
                head: CSS,
                body: `<h2>Social Stats</h2>
        <p class="page-intro">Every source of Charm, Guts, Kindness, Knowledge and
        Proficiency in Persona 5 Royal, with the exact point values.</p>
        <ul class="card-grid card-grid--wide">
${meta
    .map(
        (m) => `          <li><a class="card card--wide" href="${escapeHtml(
            link(1, `social-stats/${m.slug}.html`),
        )}">
            <span class="card-body">${escapeHtml(m.label)}<small>${escapeHtml(
                m.description.slice(0, 110) + (m.description.length > 110 ? "\u2026" : ""),
            )}</small></span>
          </a></li>`,
    )
    .join("\n")}
        </ul>`,
            }),
        ),
    );

    for (const m of meta) {
        written.push(
            await write(
                `social-stats/${m.slug}.html`,
                page({
                    title: m.label,
                    description: m.description,
                    depth: 1,
                    current: "social-stats",
                    breadcrumbs: [
                        { href: "", label: "Home" },
                        { href: "social-stats/", label: "Social Stats" },
                        { label: m.label },
                    ],
                    head: CSS,
                    body: `<article class="prose">
        <h2>${escapeHtml(m.label)}</h2>
        ${renderBlocks(m.blocks)}
      </article>`,
                }),
            ),
        );
    }

    return written;
}

/* -------------------------------------------------------------------- home */

async function buildHome() {
    const [confidants, shadows, classroom, negotiation, social] = await Promise.all([
        readJson("confidants/index.json"),
        readJson("shadows/locations.json"),
        readJson("classroom/exams.json"),
        wireQuestions(await readJson("negotiation/questions.json")),
        Promise.resolve(
            (await readdir(path.join(DATA, "social-stats")))
                .filter((f) => f.endsWith(".json"))
                .map((f) => f.replace(/\.json$/, "")),
        ),
    ]);

    const shadowCount = shadows.groups.reduce((n, g) => n + g.locations.length, 0);
    const shadowRows = shadows.groups.reduce(
        (n, g) => n + g.locations.reduce((m, l) => m + l.rows.length, 0),
        0,
    );

    const sections = [
        {
            href: "confidants/",
            title: "Confidants",
            blurb: `${confidants.length} companions with abilities, schedules, rank-up choices and gift guides.`,
            stat: `${confidants.length} guides`,
        },
        {
            href: "shadows/",
            title: "Shadow Locations",
            blurb: `${shadowCount} locations and ${shadowRows} Shadows across every palace and Mementos floor.`,
            stat: `${shadowRows} shadows`,
        },
        {
            href: "classroom/",
            title: "Classroom Answers",
            blurb: `All ${classroom.exams.length} exams with the best response for each one.`,
            stat: `${classroom.exams.length} exams`,
        },
        {
            href: "negotiation/",
            title: "Negotiation Questions",
            blurb: `Search all ${negotiation.length} prompts and see how each answer shifts the four personalities.`,
            stat: `${negotiation.length} questions`,
        },
        {
            href: "social-stats/",
            title: "Social Stats",
            blurb: `Charm, Guts, Kindness, Knowledge and Proficiency - every way to raise them.`,
            stat: `${social.length} stats`,
        },
    ];

    const body = `<h2>Everything you need in one place</h2>
      <p class="page-intro">A companion for Persona 5 Royal: every confidant, every
      Shadow, every exam answer and every negotiation prompt.</p>

      <ul class="card-grid card-grid--wide">
${sections
    .map(
        (s) => `        <li><a class="card card--wide" href="${escapeHtml(
            link(0, s.href),
        )}">
          <span class="card-body">${escapeHtml(s.title)}<small>${escapeHtml(
              s.blurb,
          )}</small></span>
        </a></li>`,
    )
    .join("\n")}
      </ul>

      <h2>Start with a confidant</h2>
      ${arcanaGridFor(0, confidants)}`;

    return [
        await write(
            "index.html",
            page({
                title: "",
                depth: 0,
                current: "",
                head: CSS,
                body,
            }),
        ),
    ];
}

function arcanaGridFor(depth, index) {
    const cards = index
        .map(
            (c) => `      <li><a class="card" href="${escapeHtml(
                link(depth, `confidants/${c.slug}.html`),
            )}">
        <img src="${escapeHtml(
            link(depth, `assets/img/confidants/sm/${c.slug}.png`),
        )}" alt="${escapeHtml(c.person)}" width="125" height="125" loading="lazy" />
        <span class="card-body">${escapeHtml(c.arcana)}<small>${escapeHtml(
            c.person,
        )}</small></span>
      </a></li>`,
        )
        .join("\n");
    return `<ul class="card-grid">\n${cards}\n    </ul>`;
}

/* ---------------------------------------------------------------- runtime */

/** Hand-written client-side JS is copied, not generated. */
async function copyRuntime() {
    const src = path.join(ROOT, "_build", "runtime");
    if (!existsSync(src)) return [];
    const out = [];
    for (const file of await readdir(src)) {
        await cp(path.join(src, file), path.join(ROOT, "assets", "js", file));
        out.push(`assets/js/${file}`);
    }
    return out;
}

/* -------------------------------------------------------------------- run */

console.log("Building site from data/ ...");

const written = [
    ...(await buildHome()),
    ...(await buildConfidants()),
    ...(await buildShadows()),
    ...(await buildClassroom()),
    ...(await buildNegotiation()),
    ...(await buildSocialStats()),
    ...(await copyRuntime()),
];

console.log(`  wrote ${written.length} files`);
console.log("Done. Run `npm run check` to validate links and assets.");
