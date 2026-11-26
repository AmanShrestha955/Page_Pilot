const MARKER = "\\[(?:\\d{1,3}|[a-z]{1,2}|citation needed)\\]";

// A marker right after sentence punctuation, plus any markers chained behind it.
const CITATION_MARKERS = new RegExp(
    `(?<=[.,;!?”’])${MARKER}(?:\\s?${MARKER})*`,
    "gi"
);

/** Removes reference markers such as [12] or [a] that follow punctuation. */
export function removeCitationMarkers(text: string): string {
    return text.replace(CITATION_MARKERS, "");
}