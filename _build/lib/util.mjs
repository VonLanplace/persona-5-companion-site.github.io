/**
 * Shared helpers for the build pipeline.
 */

/** Decode the handful of entities the source content uses. */
export function decodeEntities(input) {
    return String(input ?? "")
        .replace(/&nbsp;/g, " ")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

/** Collapse runs of whitespace and decode entities in a plain-text blob. */
export function normalizeText(input) {
    return decodeEntities(String(input ?? ""))
        .replace(/[ \t]+/g, " ")
        .replace(/\s*\n\s*/g, " ")
        .trim();
}

/** Escape a value for safe interpolation into HTML text or attribute positions. */
export function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** Strip every tag, returning plain text. */
export function stripTags(html) {
    return normalizeText(
        String(html ?? "")
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/<[^>]+>/g, ""),
    );
}

/**
 * Normalize tag spelling in a stored cell, so artefacts inherited from the
 * hand-formatted legacy markup (`<strong >`, `<br />`) do not leak into the
 * output. Attribute values are preserved.
 */
export function tidyCell(html) {
    return String(html ?? "")
        .replace(/<([a-z][a-z0-9]*)(\s[^>]*?)?>/gi, (match, tag, attrs = "") => {
            const a = attrs.replace(/\s+/g, " ").trim();
            return a ? `<${tag} ${a}>` : `<${tag}>`;
        })
        .replace(/<\/([a-z][a-z0-9]*)\s*>/gi, "</$1>")
        .replace(/>\s+</g, "><")
        .trim();
}
