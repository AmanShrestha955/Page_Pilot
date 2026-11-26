import { describe, expect, it } from "vitest";
import { friendlyError } from "../../src/frontend/utils/friendly-error";
import type { AIErrorCode } from "../../src/core/types/ai";

const expectedMessages: Record<AIErrorCode, string> = {
    INVALID_REQUEST:
        "PagePilot couldn't process that request. Check your input, then try again.",
    NO_PAGE_CONTENT:
        "PagePilot couldn't find readable content on this page. Refresh the page, then try again.",
    MODEL_UNAVAILABLE:
        "The AI model isn't available right now. Wait a moment, then try again.",
    AUTHENTICATION_FAILED:
        "PagePilot couldn't verify access to the AI service. Reload the extension, then try again.",
    RATE_LIMITED:
        "The AI service is receiving too many requests. Wait a moment, then try again.",
    NETWORK_ERROR:
        "PagePilot couldn't reach the AI service. Check your internet connection, then try again.",
    CONFIGURATION_ERROR:
        "PagePilot isn't set up correctly. Check the Firebase settings and try again.",
    INFERENCE_FAILED: "The AI couldn't write a response. Try again.",
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
