import type { AIErrorCode } from "../../core/types/ai";

const GENERIC = "Something went wrong. Try again.";

const ERROR_MESSAGES: Record<AIErrorCode, string> = {
    INVALID_REQUEST: "PagePilot couldn't process that request. Check your input, then try again.",
    NO_PAGE_CONTENT: "PagePilot couldn't find readable content on this page. Refresh the page, then try again.",
    MODEL_UNAVAILABLE: "The AI model isn't available right now. Wait a moment, then try again.",
    AUTHENTICATION_FAILED: "PagePilot couldn't verify access to the AI service. Reload the extension, then try again.",
    RATE_LIMITED: "The AI service is receiving too many requests. Wait a moment, then try again.",
    NETWORK_ERROR: "PagePilot couldn't reach the AI service. Check your internet connection, then try again.",
    CONFIGURATION_ERROR: "PagePilot isn't set up correctly. Check the Firebase settings and try again.",
    INFERENCE_FAILED: "The AI couldn't write a response. Try again.",
};

// Retrying can't fix these.
const NOT_RETRYABLE: ReadonlySet<string> = new Set([
    "INVALID_REQUEST",
    "NO_PAGE_CONTENT",
    "AUTHENTICATION_FAILED",
    "CONFIGURATION_ERROR",
]);

function getCode(error: unknown): string | null {
    if (typeof error !== "object" || error === null || !("code" in error)) {
        return null;
    }
    return typeof error.code === "string" ? error.code : null;
}

export function friendlyError(error: unknown): string {
    const code = getCode(error);
    if (code && Object.hasOwn(ERROR_MESSAGES, code)) {
        return ERROR_MESSAGES[code as AIErrorCode];
    }
    return GENERIC;
}

export function isRetryable(error: unknown): boolean {
    const code = getCode(error);
    return !(code && NOT_RETRYABLE.has(code));
}