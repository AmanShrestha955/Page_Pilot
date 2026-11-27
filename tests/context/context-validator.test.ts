
import { describe, it, expect } from "vitest";
import { validatePageContext } from "../../src/core/context/context-validator";
import type { PageContext } from "../../src/core/types/ai";

const validContext: PageContext = {
    url: "https://example.com/article",
    title: "Example Article",
    domain: "example.com",
    headings: ["Introduction", "Conclusion"],
    content: "This is some article content.",
    extractedAt: Date.now(),
};

describe("validatePageContext", () => {
    it("should accept valid page context", () => {
        expect(() => validatePageContext(validContext)).not.toThrow();
    });

    it("should reject an empty URL", () => {
        expect(() =>
            validatePageContext({ ...validContext, url: "" })
        ).toThrow("Page URL is missing.");
    });

    it("should reject empty page content", () => {
        expect(() =>
            validatePageContext({
                ...validContext,
                content: "",
                selectedText: undefined,
            })
        ).toThrow("No usable page content found.");
    });

    it("should reject whitespace-only content", () => {
        expect(() =>
            validatePageContext({
                ...validContext,
                content: "   \n  ",
                selectedText: undefined,
            })
        ).toThrow("No usable page content found.");
    });

    it("should accept selected text without full page content", () => {
        expect(() =>
            validatePageContext({
                ...validContext,
                content: "",
                selectedText: "A selected passage.",
            })
        ).not.toThrow();
    });

    it("should reject a missing context", () => {
        expect(() =>
            validatePageContext(null as unknown as PageContext)
        ).toThrow("Page context is missing.");
    });

    it("should reject malformed URLs", () => {
        expect(() =>
            validatePageContext({ ...validContext, url: "not-a-url" })
        ).toThrow("Invalid page URL.");
    });

    it("should reject unsupported URL protocols", () => {
        expect(() =>
            validatePageContext({
                ...validContext,
                url: "file:///home/user/document.html",
            })
        ).toThrow("Invalid page URL.");
    });
});
