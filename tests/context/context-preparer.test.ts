
import { describe, it, expect } from "vitest";
import { preparePageContext } from "../../src/core/context/context-preparer";
import type { PageContext } from "../../src/core/types/ai";

const validContext: PageContext = {
    url: "https://example.com/article",
    title: "  Example Article  ",
    domain: "example.com",
    headings: [
        "  Introduction  ",
        "",
        "Conclusion",
    ],
    content: "  This is   an article.\n\nIt has multiple lines.  ",
    selectedText: "  Important paragraph  ",
    extractedAt: Date.now(),
};

describe("preparePageContext", () => {
    it("should normalize whitespace while preserving paragraph boundaries", () => {
        const result = preparePageContext(validContext);

        expect(result.content).toBe(
            "This is an article.\n\nIt has multiple lines."
        );
    });

    it("should normalize Windows line endings", () => {
        const context = {
            ...validContext,
            content: "First paragraph.\r\n\r\nSecond paragraph.",
        };

        const result = preparePageContext(context);

        expect(result.content).toBe(
            "First paragraph.\n\nSecond paragraph."
        );
    });

    it("should collapse excessive blank lines", () => {
        const context = {
            ...validContext,
            content: "First paragraph.\n\n\n\nSecond paragraph.",
        };

        const result = preparePageContext(context);

        expect(result.content).toBe(
            "First paragraph.\n\nSecond paragraph."
        );
    });

    it("should normalize spaces and tabs without removing line breaks", () => {
        const context = {
            ...validContext,
            content: "  First   paragraph.\t\n  Second   paragraph.  ",
        };

        const result = preparePageContext(context);

        expect(result.content).toBe(
            "First paragraph.\nSecond paragraph."
        );
    });

    it("should trim the page title", () => {
        const result = preparePageContext(validContext);

        expect(result.title).toBe("Example Article");
    });

    it("should clean and remove empty headings", () => {
        const result = preparePageContext(validContext);

        expect(result.headings).toEqual([
            "Introduction",
            "Conclusion",
        ]);
    });

    it("should trim selected text", () => {
        const result = preparePageContext(validContext);

        expect(result.selectedText).toBe("Important paragraph");
    });

    it("should preserve the original context fields", () => {
        const result = preparePageContext(validContext);

        expect(result.url).toBe(validContext.url);
        expect(result.domain).toBe(validContext.domain);
        expect(result.extractedAt).toBe(validContext.extractedAt);
    });

    it("should reject invalid page context", () => {
        expect(() =>
            preparePageContext({
                ...validContext,
                content: "   ",
                selectedText: undefined,
            })
        ).toThrow("No usable page content found.");
    });

    it("should not modify the original context", () => {
        const originalContent = validContext.content;

        preparePageContext(validContext);

        expect(validContext.content).toBe(originalContent);
    });
});
