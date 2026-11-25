import { describe, expect, it } from "vitest";
import { friendlyError } from "../../src/frontend/utils/friendly-error";
import type { AIErrorCode } from "../../src/core/types/ai";

const expectedMessages: Record<AIErrorCode, string> = {
    INVALID_REQUEST: "The request couldn't be processed. Check your input and try again.",
    NO_PAGE_CONTENT: "PagePilot couldn't find readable webpage content. Refresh the page and try again.",
    MODEL_UNAVAILABLE: "The selected AI model isn't available right now.",
    AUTHENTICATION_FAILED: "PagePilot couldn't verify access to the AI service.",
    RATE_LIMITED: "The AI service is receiving too many requests. Wait a moment, then try again.",
    NETWORK_ERROR: "PagePilot couldn't reach the AI service. Check your internet connection, then try again.",
    CONFIGURATION_ERROR: "The AI service isn't configured correctly. Please try again later.",
    INFERENCE_FAILED: "The AI couldn't generate a response. Please try again.",
};

describe("friendlyError", () => {
    it.each(Object.entries(expectedMessages))(
        "maps %s to a user-friendly message",
        (code, message) => {
            expect(friendlyError({ code })).toBe(message);
        }
    );

    it("handles ordinary JavaScript errors", () => {
        expect(friendlyError(new Error("Internal Firebase error"))).toBe(
            "Something went wrong. Try again."
        );
    });

    it("handles null and undefined", () => {
        expect(friendlyError(null)).toBe("Something went wrong. Try again.");
        expect(friendlyError(undefined)).toBe("Something went wrong. Try again.");
    });

    it("handles unknown error codes", () => {
        expect(friendlyError({ code: "UNKNOWN_ERROR" })).toBe(
            "Something went wrong. Try again."
        );
    });

    it("does not expose raw backend error messages", () => {
        expect(
            friendlyError({
                code: "INFERENCE_FAILED",
                message: "Internal server details and API credentials",
            })
        ).toBe(expectedMessages.INFERENCE_FAILED);
    });
});
