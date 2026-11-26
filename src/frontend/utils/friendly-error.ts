import type { AIErrorCode } from "../../core/types/ai";

const ERROR_MESSAGES: Record<AIErrorCode, string> = {
    INVALID_REQUEST: "The request couldn't be processed. Check your input and try again.",
    NO_PAGE_CONTENT: "PagePilot couldn't find readable webpage content. Refresh the page and try again.",
    MODEL_UNAVAILABLE: "The selected AI model isn't available right now.",
    AUTHENTICATION_FAILED: "PagePilot couldn't verify access to the AI service.",
    RATE_LIMITED: "The AI service is receiving too many requests. Wait a moment, then try again.",
    NETWORK_ERROR: "PagePilot couldn't reach the AI service. Check your internet connection, then try again.",
    CONFIGURATION_ERROR: "The AI service isn't configured correctly. Please try again later.",
    INFERENCE_FAILED: "The AI couldn't generate a response. Please try again.",
};

export function friendlyError(error: unknown): string {
    if (typeof error !== "object" || error === null || !("code" in error)) {
        return "Something went wrong. Try again.";
    }

    const code = error.code;

    if (typeof code !== "string" || !Object.hasOwn(ERROR_MESSAGES, code)) {
        return "Something went wrong. Try again.";
    }

    return ERROR_MESSAGES[code as AIErrorCode];
}
