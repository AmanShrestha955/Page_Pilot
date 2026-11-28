/** Turns markdown into plain text that sounds natural when read aloud. */
export function toSpeakable(markdown: string): string {
    return markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]*)`/g, "$1")
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/^#{1,6}\s*/gm, "")
        .replace(/^\s*[-*+]\s+/gm, "")
        .replace(/^\s*\d+\.\s+/gm, "")
        .replace(/^\s*>\s?/gm, "")
        .replace(/(\*\*|__|\*|~~)/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim();
}

function splitLong(sentence: string, maxLen: number): string[] {
    const parts: string[] = [];
    let rest = sentence;

    while (rest.length > maxLen) {
        let cut = rest.lastIndexOf(" ", maxLen);
        if (cut < maxLen * 0.5) cut = maxLen;
        parts.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
    }
    if (rest) parts.push(rest);

    return parts;
}

function packSentences(sentences: string[], maxLen: number): string[] {
    const chunks: string[] = [];
    let buffer = "";

    for (const s of sentences) {
        if (s.length > maxLen) {
            if (buffer) chunks.push(buffer);
            buffer = "";
            chunks.push(...splitLong(s, maxLen));
        } else if ((buffer + " " + s).trim().length > maxLen) {
            chunks.push(buffer);
            buffer = s;
        } else {
            buffer = (buffer + " " + s).trim();
        }
    }

    if (buffer) chunks.push(buffer);
    return chunks;
}

/** Splits text into short pieces at line and sentence boundaries. */
export function splitIntoChunks(text: string, maxLen = 220): string[] {
    return text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line) => packSentences(line.split(/(?<=[.!?])\s+/), maxLen));
}