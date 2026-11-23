import { Readability } from "@mozilla/readability";
import type { PageContext } from "../../core/types/ai";

const MAX_CHARS = 30000;

export function extractPage(): PageContext {
    // Parse a detached document so Readability doesn't mutate the live webpage.
    const parsedDocument = new DOMParser().parseFromString(
        document.documentElement.outerHTML,
        "text/html"
    );

    const article = new Readability(parsedDocument).parse();

    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
        .map((h) => h.textContent?.trim() ?? "")
        .filter(Boolean)
        .slice(0, 40);

    const raw = article?.textContent ?? document.body.innerText;
    const content = raw.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_CHARS);

    const selectedText = window.getSelection()?.toString().trim() || undefined;

    return {
        url: location.href,
        domain: location.hostname,
        title: article?.title || document.title,
        headings,
        content,
        selectedText,
        extractedAt: Date.now(),
    };
}