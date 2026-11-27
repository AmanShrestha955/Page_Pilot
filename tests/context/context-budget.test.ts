import { describe, expect, it } from "vitest";
import {
    assessContextBudget,
    MAX_ON_DEVICE_PROMPT_CHARS,
} from "../../src/core/context/context-budget";

describe("assessContextBudget", () => {
    it("should accept a prompt within the budget", () => {
        const result = assessContextBudget("a".repeat(100));

        expect(result.fitsOnDevice).toBe(true);
        expect(result.characterCount).toBe(100);
    });

    it("should reject a prompt exceeding the budget", () => {
        const result = assessContextBudget(
            "a".repeat(MAX_ON_DEVICE_PROMPT_CHARS + 1)
        );

        expect(result.fitsOnDevice).toBe(false);
    });

    it("should accept a prompt exactly at the budget", () => {
        const result = assessContextBudget(
            "a".repeat(MAX_ON_DEVICE_PROMPT_CHARS)
        );

        expect(result.fitsOnDevice).toBe(true);
    });

    it("should support a custom budget", () => {
        const result = assessContextBudget("123456", 5);

        expect(result.fitsOnDevice).toBe(false);
        expect(result.maxCharacters).toBe(5);
    });
});