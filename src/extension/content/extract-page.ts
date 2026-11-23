import { Readability } from "@mozilla/readability";
import type { PageContext } from "../../core/types/ai";

const MAX_CHARS = 30000;

export function extractPage(): PageContext {
    // Readability mutates the DOM it parses, so always give it a clone
    const clone = document.cloneNode(true) as Document;
    const article = new Readability(clone).parse();

    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
        .map((h) => h.textContent?.trim() ?? "")
        .filter(Boolean)
        .slice(0, 40);

    const raw = article?.textContent ?? document.body.innerText;
    const content = raw.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_CHARS);

    const selectedText = window.getSelection()?.toString().trim() || undefined;

    return {
        url: location.href,
        title: article?.title || document.title,
        headings,
        content,
        selectedText,
    };
}