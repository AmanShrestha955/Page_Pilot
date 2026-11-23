
import type { PageContext } from "../types/ai";
import { validatePageContext } from "./context-validator";

export function preparePageContext(
    context: PageContext
): PageContext {
    validatePageContext(context);

    const cleanContent = context.content
        .replace(/\s+/g, " ")
        .trim();

    const cleanHeadings = context.headings
        .filter((heading) => typeof heading === "string")
        .map((heading) => heading.trim())
        .filter(Boolean);

    return {
        ...context,
        title: context.title.trim(),
        content: cleanContent,
        headings: cleanHeadings,
        selectedText: context.selectedText?.trim() || undefined,
    };
}
