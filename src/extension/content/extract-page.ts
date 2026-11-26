import { Readability } from "@mozilla/readability";
import type { PageContext } from "../../core/types/ai";
import { truncateAtBoundary } from "../../core/utils/truncate";

const MAX_CHARS = 30000;
const MAX_SELECTION_CHARS = 5000;
const MAX_HEADINGS = 40;
const MIN_ARTICLE_CHARS = 500;

const BLOCK_SELECTOR =
    "h1,h2,h3,h4,h5,h6,p,li,pre,blockquote,figcaption,dt,dd,tr";

// Page furniture that isn't part of the content being read.
const NOISE_SELECTOR = [
    "script", "style", "noscript", "template", "svg", "canvas", "iframe",
    "nav", "footer", "aside", "button", "body > header",
    "[role='navigation']", "[role='complementary']", "[role='banner']",
    "[role='contentinfo']", "[aria-hidden='true']", "[hidden]",
    "sup.reference", ".mw-editsection", ".noprint",
].join(",");

interface Block {
    tag: string;
    text: string;
}

function clean(text: string): string {
    return text.replace(/\s+/g, " ").trim();
}

function stripNoise(root: Element): void {
    root.querySelectorAll(NOISE_SELECTOR).forEach((n) => n.remove());
}

function collectBlocks(root: Element): Block[] {
    const blocks: Block[] = [];

    for (const el of Array.from(root.querySelectorAll(BLOCK_SELECTOR))) {
        // Only innermost blocks, so nested text isn't repeated.
        if (el.querySelector(BLOCK_SELECTOR)) continue;

        const tag = el.tagName.toLowerCase();
        let text: string;

        if (tag === "pre") {
            text = (el.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 1500);
        } else if (tag === "tr") {
            text = Array.from(el.children)
                .map((cell) => clean(cell.textContent ?? ""))
                .filter(Boolean)
                .join(" | ");
        } else {
            text = clean(el.textContent ?? "");
            if (/^h[1-6]$/.test(tag)) text = text.replace(/\[edit\]/gi, "").trim();
        }

        if (text.length >= 2) blocks.push({ tag, text });
    }

    return blocks;
}

function blocksToText(blocks: Block[]): string {
    let out = "";
    let prev: Block | undefined;

    for (const b of blocks) {
        const line = b.tag === "li" ? `- ${b.text}` : b.text;
        if (prev) out += prev.tag === "li" && b.tag === "li" ? "\n" : "\n\n";
        out += line;
        prev = b;
    }

    return out;
}

function pickHeadings(blocks: Block[]): string[] {
    const seen = new Set<string>();
    const headings: string[] = [];

    for (const b of blocks) {
        if (b.tag !== "h1" && b.tag !== "h2" && b.tag !== "h3") continue;
        if (b.text.length < 3 || b.text.length > 160 || seen.has(b.text)) continue;
        seen.add(b.text);
        headings.push(b.text);
        if (headings.length >= MAX_HEADINGS) break;
    }

    return headings;
}

/** For pages Readability can't parse: use the main region with page furniture removed. */
function fallbackRoot(): Element {
    const main = document.querySelector("main, [role='main']");
    const articles = document.querySelectorAll("article");
    const source = main ?? (articles.length === 1 ? articles[0] : document.body);

    const root = source.cloneNode(true) as Element;
    stripNoise(root);
    return root;
}

function readBlocks(): { blocks: Block[]; title?: string } {
    // Readability changes the DOM it parses, so give it a detached copy.
    const copy = new DOMParser().parseFromString(
        document.documentElement.outerHTML,
        "text/html"
    );
    const article = new Readability(copy).parse();

    if (article?.content) {
        const body = new DOMParser().parseFromString(article.content, "text/html").body;
        stripNoise(body);
        const blocks = collectBlocks(body);
        const length = blocks.reduce((n, b) => n + b.text.length, 0);

        if (length >= MIN_ARTICLE_CHARS) {
            return { blocks, title: article.title ?? undefined };
        }
    }

    return { blocks: collectBlocks(fallbackRoot()) };
}

function readSelection(): string | undefined {
    const raw = window.getSelection()?.toString() ?? "";
    const cleaned = raw
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    return cleaned ? truncateAtBoundary(cleaned, MAX_SELECTION_CHARS).text : undefined;
}

/** Last resort for pages built from generic elements (web apps, code viewers). */
function lastResortText(): string {
    const source =
        (document.querySelector("main, [role='main']") as HTMLElement | null) ??
        document.body;

    return source.innerText
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trim())
        // Drop blank lines and lines that are only a number (line numbers, counters).
        .filter((line) => line && !/^\d{1,5}$/.test(line))
        .join("\n");
}


export function extractPage(): PageContext {
    const { blocks, title } = readBlocks();

    let text = blocksToText(blocks);
    if (text.length < MIN_ARTICLE_CHARS) {
        const raw = lastResortText();
        if (raw.length > text.length) text = raw;
    }

    const { text: content, truncated } = truncateAtBoundary(text, MAX_CHARS);

    return {
        url: location.href,
        domain: location.hostname,
        title: title || document.title,
        headings: pickHeadings(blocks),
        content,
        selectedText: readSelection(),
        extractedAt: Date.now(),
        truncated,
    };
}