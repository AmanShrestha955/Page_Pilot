
/**
 * The inference tasks supported by the initial MVP.
 */
export type AITask =
    | "explain"
    | "simplify"
    | "summarize"
    | "ask";

/**
 * The source of inference actually used.
 */
export type InferenceSource = "on-device" | "cloud";

/**
 * The inference preference.
 * "auto" lets our orchestrator decide.
 */
export type InferenceMode =
    | "auto"
    | "on-device"
    | "cloud";

/**
 * The difficulty level of an explanation.
 */
export type Difficulty =
    | "beginner"
    | "intermediate"
    | "advanced";

/**
 * Context extracted from the webpage.
 */
export interface PageContext {
    url: string;
    title: string;
    domain: string;
    headings: string[];
    content: string;
    selectedText?: string;
    extractedAt: number;
    truncated?: boolean;
}

/**
 * Request sent from the frontend to the AI service.
 */
export interface AIRequest {
    task: AITask;
    context: PageContext;
    question?: string;
    difficulty?: Difficulty;
    inferenceMode?: InferenceMode;
}

/**
 * References connecting an AI answer to webpage content.
 */
export interface AIReference {
    heading?: string;
    excerpt?: string;
}

/**
 * Standard response returned by the AI service.
 */
export interface AIResponse {
    answer: string;
    task: AITask;

    inference: {
        source: InferenceSource;
        requestedMode: InferenceMode;
        fallbackUsed: boolean;
    };

    references?: AIReference[];
}

/**
 * Errors that the AI service may report.
 */
export type AIErrorCode =
    | "INVALID_REQUEST"
    | "NO_PAGE_CONTENT"
    | "MODEL_UNAVAILABLE"
    | "CONTEXT_TOO_LARGE"
    | "INCOMPLETE_CONTEXT"
    | "AUTHENTICATION_FAILED"
    | "RATE_LIMITED"
    | "NETWORK_ERROR"
    | "CONFIGURATION_ERROR"
    | "INFERENCE_FAILED";