
import { generateHybridGemini } from "../models/gemini";
import { buildExplainPrompt } from "../prompts/explain.prompt";

import { preparePageContext } from "../../core/context/context-preparer";
import { assessContextBudget } from "../../core/context/context-budget";

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

    // Summarization and Ask require the wider webpage context.
    if (
        (request.task === "summarize" || request.task === "ask") &&
        !hasPageContent
    ) {
        throw new AIServiceError(
            "NO_PAGE_CONTENT",
            "Full webpage content is required for this task."
        );
    }

    // Explain and simplify can operate on selected text alone.
    if (
        request.task !== "summarize" &&
        request.task !== "ask" &&
        !hasSelectedText &&
        !hasPageContent
    ) {
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

/**
 * Determines whether the requested task depends on the full extracted page.
 *
 * Explain and simplify can use a selected passage as their complete target.
 * Summarize and ask always need the wider page context.
 */
function requiresFullPageContext(request: AIRequest): boolean {
    if (request.task === "summarize" || request.task === "ask") {
        return true;
    }

    return !request.context.selectedText?.trim();
}

function getErrorCode(error: unknown): AIErrorCode {
    if (error instanceof AIServiceError) {
        return error.code;
    }

    if (typeof error !== "object" || error === null) {
        return "INFERENCE_FAILED";
    }

    const sdkCode =
        "code" in error && typeof error.code === "string"
            ? error.code.toLowerCase()
            : "";

    const message =
        error instanceof Error ? error.message.toLowerCase() : "";

    const customData =
        "customErrorData" in error &&
            typeof error.customErrorData === "object" &&
            error.customErrorData !== null
            ? error.customErrorData
            : null;

    const status =
        customData &&
            "status" in customData &&
            typeof customData.status === "number"
            ? customData.status
            : undefined;

    if (
        [
            "api-not-enabled",
            "no-api-key",
            "no-app-id",
            "no-project-id",
            "no-model",
        ].includes(sdkCode)
    ) {
        return "CONFIGURATION_ERROR";
    }

    if (status === 429) {
        return "RATE_LIMITED";
    }

    if (status === 401 || status === 403) {
        return "AUTHENTICATION_FAILED";
    }

    if (status !== undefined && status >= 500 && status <= 599) {
        return "INFERENCE_FAILED";
    }

    if (status !== undefined && status >= 400 && status <= 499) {
        return "INFERENCE_FAILED";
    }

    if (
        sdkCode.includes("resource-exhausted") ||
        sdkCode.includes("too-many-requests")
    ) {
        return "RATE_LIMITED";
    }

    if (
        sdkCode.includes("unauthenticated") ||
        sdkCode.includes("permission-denied") ||
        sdkCode.includes("app-check")
    ) {
        return "AUTHENTICATION_FAILED";
    }

    if (
        sdkCode.includes("network") ||
        sdkCode.includes("deadline-exceeded")
    ) {
        return "NETWORK_ERROR";
    }

    if (
        sdkCode === "request-error" ||
        sdkCode === "response-error" ||
        sdkCode === "fetch-error" ||
        sdkCode === "parse-failed"
    ) {
        return "INFERENCE_FAILED";
    }

    if (
        message.includes("429") ||
        message.includes("resource-exhausted") ||
        message.includes("too many requests")
    ) {
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
        message.includes("failed to fetch") ||
        message.includes("network error") ||
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

    try {
        // Normalize and validate extracted context before constructing prompts.
        let preparedContext;

        try {
            preparedContext = preparePageContext(request.context);
        } catch (error) {
            throw new AIServiceError(
                "INVALID_REQUEST",
                error instanceof Error
                    ? error.message
                    : "Invalid page context."
            );
        }

        const preparedRequest: AIRequest = {
            ...request,
            context: preparedContext,
        };

        const prompt = buildExplainPrompt(preparedRequest);

        const requiresFullPage = requiresFullPageContext(preparedRequest);

        const incompleteContext =
            requiresFullPage && preparedContext.truncated === true;

        const budget = assessContextBudget(prompt);

        let effectiveMode: InferenceMode = requestedMode;

        // Strict on-device mode must never silently use cloud inference.
        if (requestedMode === "on-device") {
            if (incompleteContext) {
                throw new AIServiceError(
                    "INCOMPLETE_CONTEXT",
                    "The webpage extraction is incomplete. Strict on-device inference requires complete extracted context for this task."
                );
            }

            if (!budget.fitsOnDevice) {
                throw new AIServiceError(
                    "CONTEXT_TOO_LARGE",
                    `The prompt contains ${budget.characterCount} characters, exceeding the provisional on-device budget of ${budget.maxCharacters} characters.`
                );
            }
        }

        // Automatic routing: use cloud directly when local inference is
        // unsuitable because of prompt size or incomplete full-page extraction.
        if (requestedMode === "auto") {
            if (incompleteContext || !budget.fitsOnDevice) {
                effectiveMode = "cloud";
            } else {
                effectiveMode = "auto";
            }
        }

        const result = await generateHybridGemini(
            prompt,
            effectiveMode
        );

        if (!result.text.trim()) {
            throw new AIServiceError(
                "INFERENCE_FAILED",
                "The AI model returned an empty response."
            );
        }

        // Defensive checks: strict modes must honor their requested source.
        if (
            requestedMode === "on-device" &&
            result.source !== "on-device"
        ) {
            throw new AIServiceError(
                "MODEL_UNAVAILABLE",
                "Strict on-device inference did not return an on-device result."
            );
        }

        if (
            requestedMode === "cloud" &&
            result.source !== "cloud"
        ) {
            throw new AIServiceError(
                "INFERENCE_FAILED",
                "Cloud-only inference returned an unexpected inference source."
            );
        }

        // Only count SDK-managed fallback when auto mode was actually
        // requested from the SDK. Direct cloud routing is not fallback.
        const fallbackUsed =
            requestedMode === "auto" &&
            effectiveMode === "auto" &&
            result.source === "cloud";

        return {
            answer: result.text,
            task: request.task,
            inference: {
                source: result.source,
                requestedMode,
                fallbackUsed,
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
