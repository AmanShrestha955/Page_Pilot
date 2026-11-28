import { describe, expect, it } from "vitest";
import { splitIntoChunks, toSpeakable } from "../../src/frontend/utils/speech-text";

describe("toSpeakable", () => {
    it("removes markdown symbols", () => {
        const text = toSpeakable("### Title\n\n**Bold** and `code`\n\n- item one\n- item two");
        expect(text).not.toMatch(/[#*`]/);
        expect(text).toContain("Bold and code");
        expect(text).toContain("item one");
    });

    it("keeps link text but drops the URL", () => {
        expect(toSpeakable("See [the docs](https://example.com) now")).toBe(
            "See the docs now"
        );
    });
});

describe("splitIntoChunks", () => {
    it("keeps short text in one piece", () => {
        expect(splitIntoChunks("One short sentence.")).toEqual(["One short sentence."]);
    });

    it("splits long text without exceeding the limit", () => {
        const text = "This is a sentence. ".repeat(40);
        const chunks = splitIntoChunks(text, 100);
        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks.every((c) => c.length <= 100)).toBe(true);
    });

    it("splits an extremely long sentence at word boundaries", () => {
        const chunks = splitIntoChunks("word ".repeat(100).trim(), 50);
        expect(chunks.every((c) => c.length <= 50)).toBe(true);
    });
});