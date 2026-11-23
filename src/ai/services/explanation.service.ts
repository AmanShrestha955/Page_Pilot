import { askGemini } from "../models/gemini";
import { buildExplainPrompt } from "../prompts/explain.prompt";

import type {
    AIRequest,
    AIResponse,
    AIErrorCode,
    InferenceMode,
} from "../../core/types/ai";

export class AIServiceError extends Error {
    public code: AIErrorCode;

    constructor(code: AIErrorCode, message: string) {
        super(message);

        this.name = "AIServiceError";
        this.code = code;
    }
}

function validateRequest(request: AIRequest): void {
    if (!request.context) {
        throw new AIServiceError(
            "INVALID_REQUEST",
            "Page context is required."
        );
    }

    const hasSelectedText = Boolean(request.context.selectedText?.trim());
    const hasPageContent = Boolean(request.context.content?.trim());

    if (request.task === "summarize" && !hasPageContent) {
        throw new AIServiceError(
            "NO_PAGE_CONTENT",
            "There is no webpage content available to summarize."
        );
    }

    if (request.task !== "summarize" && !hasSelectedText && !hasPageContent) {
        throw new AIServiceError(
            "NO_PAGE_CONTENT",
            "There is no webpage content available to analyze."
        );
    }

    if (request.task === "ask" && !request.question?.trim()) {
        throw new AIServiceError(
            "INVALID_REQUEST",
            "A question is required for the ask task."
        );
    }
}

function getErrorCode(error: unknown): AIErrorCode {
    if (error instanceof AIServiceError) {
        return error.code;
    }

    const message =
        error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("429") || message.includes("resource-exhausted")) {
        return "RATE_LIMITED";
    }

    if (
        message.includes("unauthenticated") ||
        message.includes("permission-denied") ||
        message.includes("app check")
    ) {
        return "AUTHENTICATION_FAILED";
    }

    if (
        message.includes("network") ||
        message.includes("failed to fetch") ||
        message.includes("offline")
    ) {
        return "NETWORK_ERROR";
    }

    if (
        message.includes("model") &&
        (message.includes("not found") || message.includes("unavailable"))
    ) {
        return "MODEL_UNAVAILABLE";
    }

    return "INFERENCE_FAILED";
}

export async function explainPage(
    request: AIRequest
): Promise<AIResponse> {
    validateRequest(request);

    const requestedMode: InferenceMode = request.inferenceMode ?? "auto";

    if (requestedMode === "on-device") {
        throw new AIServiceError(
            "MODEL_UNAVAILABLE",
            "On-device inference has not been implemented yet."
        );
    }

    try {
        const prompt = buildExplainPrompt(request);
        const answer = await askGemini(prompt);

        if (!answer.trim()) {
            throw new AIServiceError(
                "INFERENCE_FAILED",
                "The AI model returned an empty response."
            );
        }

        return {
            answer,
            task: request.task,
            inference: {
                source: "cloud",
                requestedMode,
                fallbackUsed: false,
            },
        };
    } catch (error) {
        if (error instanceof AIServiceError) {
            throw error;
        }

        const code = getErrorCode(error);

        throw new AIServiceError(
            code,
            error instanceof Error
                ? error.message
                : "An unexpected AI inference error occurred."
        );
    }
}