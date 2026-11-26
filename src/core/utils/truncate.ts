export interface Truncated {
    text: string;
    truncated: boolean;
}

/** Shortens text to at most `max` characters, preferring to end at a paragraph, then a sentence, then a word. */
export function truncateAtBoundary(text: string, max: number): Truncated {
    if (text.length <= max) return { text, truncated: false };

    const slice = text.slice(0, max);
    const floor = Math.floor(max * 0.6); // don't cut away too much

    const paragraph = slice.lastIndexOf("\n\n");
    if (paragraph >= floor) {
        return { text: slice.slice(0, paragraph).trimEnd(), truncated: true };
    }

    const sentence = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! ")
    );
    if (sentence >= floor) {
        return { text: slice.slice(0, sentence + 1), truncated: true };
    }

    const space = slice.lastIndexOf(" ");
    const cut = space > floor ? slice.slice(0, space) : slice;
    return { text: cut.trimEnd(), truncated: true };
}