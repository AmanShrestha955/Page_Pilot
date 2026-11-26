import { describe, expect, it } from "vitest";
import { truncateAtBoundary } from "../../src/core/utils/truncate";

describe("truncateAtBoundary", () => {
    it("returns short text unchanged", () => {
        expect(truncateAtBoundary("Hello world.", 100)).toEqual({
            text: "Hello world.",
            truncated: false,
        });
    });

    it("cuts at a paragraph boundary when one is available", () => {
        const text = "A".repeat(70) + "\n\n" + "B".repeat(70);
        const result = truncateAtBoundary(text, 100);
        expect(result.truncated).toBe(true);
        expect(result.text).toBe("A".repeat(70));
    });

    it("cuts at a sentence end otherwise", () => {
        const text = "First sentence here. Second sentence goes on and on without end";
        expect(truncateAtBoundary(text, 30).text).toBe("First sentence here.");
    });

    it("falls back to a word boundary", () => {
        const result = truncateAtBoundary("word ".repeat(30), 50);
        expect(result.truncated).toBe(true);
        expect(result.text.endsWith("word")).toBe(true);
        expect(result.text.length).toBeLessThanOrEqual(50);
    });
});