
import type { PageContext } from "../types/ai";

export function validatePageContext(context: PageContext): void {
    if (!context) {
        throw new Error("Page context is missing.");
    }


    if (typeof context.url !== "string" || !context.url.trim()) {
        throw new Error("Page URL is missing.");
    }

    try {
        const parsedUrl = new URL(context.url);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error("Unsupported URL protocol.");
        }
    } catch {
        throw new Error("Invalid page URL.");
    }


    if (typeof context.content !== "string" || !context.content.trim()) {
        throw new Error("No usable page content found.");
    }
}
