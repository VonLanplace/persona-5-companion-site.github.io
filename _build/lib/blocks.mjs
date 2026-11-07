/**
 * Structured block renderer: data/*.json -> HTML.
 *
 * Replaces the hand-rolled Markdown parser. There is no inline markup in the
 * data: a cell is a string, a link object, or an array of either, and an
 * array is what used to be a <br>-separated run. The only constructs the
 * data can express are the ones listed in `renderBlocks`.
 *
 * The HTML emitted here is byte-for-byte what the Markdown renderer produced,
 * apart from whitespace the migration deliberately normalised.
 */

import { escapeHtml } from "./util.mjs";

/**
 * The handful of inline tags that survive escaping, as before.
 *
 * NOTE: this matches the old Markdown renderer's behaviour, which returned the
 * still-escaped form. In practice nothing is ever unescaped, so a literal tag
 * in the data is always shown as text - which is what we want, since the data
 * must never be able to inject HTML. A real line break only ever comes from an
 * array being joined with <br> below.
 */
const INLINE_TAGS = /^(?:<br\s*\/?>|<em>|<\/em>|<strong>|<\/strong>|<i>|<\/i>|<b>|<\/b>|<code>|<\/code>)$/i;

const SEPARATOR = " \u00b7 ";

function escapeText(value) {
    return escapeHtml(value).replace(/&lt;(\/?[a-z][a-z0-9]*)\s*\/?&gt;/gi, (match, tag) =>
        INLINE_TAGS.test(`<${tag}>`) ? match : escapeHtml(match),
    );
}

/**
 * A link object: `{label, href}` for external, `{label, ref}` for a sibling
 * guide. Social stat pages are all depth 1 in the same directory, so a
 * sibling ref is just the bare filename.
 */
function renderLink(node) {
    const href = node.ref ? `${node.ref}.html` : node.href;
    const external = /^https?:\/\//i.test(href);
    return (
        `<a href="${escapeHtml(href)}"` +
        `${external ? ' target="_blank" rel="noopener noreferrer"' : ""}` +
        `>${escapeText(node.label)}</a>`
    );
}

function renderUnit(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) return renderLink(value);
    return escapeText(value);
}

/** An array is a multi-line cell; the array elements are joined by <br>. */
function renderValue(value) {
    return Array.isArray(value) ? value.map(renderUnit).join("<br>") : renderUnit(value);
}

function renderTable(block) {
    const thead = `<thead><tr>${block.head.map((h) => `<th>${renderValue(h)}</th>`).join("")}</tr></thead>`;
    const body = block.rows
        .map(
            (row) =>
                `<tr>${block.head.map((_, n) => `<td>${renderValue(row[n] ?? "")}</td>`).join("")}</tr>`,
        )
        .join("");
    return `<div class="table-wrap"><table>${thead}<tbody>${body}</tbody></table></div>`;
}

/**
 * @param {Array<object>} blocks
 * @returns {string} HTML
 */
export function renderBlocks(blocks) {
    return blocks
        .map((block) => {
            switch (block.type) {
                case "heading":
                    return `<h${block.level}>${escapeText(block.text)}</h${block.level}>`;
                case "paragraph":
                    return `<p>${escapeText(block.text)}</p>`;
                case "links":
                    return `<p>${block.items.map(renderLink).join(SEPARATOR)}</p>`;
                case "table":
                    return renderTable(block);
                default:
                    throw new Error(`unknown block type: ${block.type}`);
            }
        })
        .join("\n");
}
