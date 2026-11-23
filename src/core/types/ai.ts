export interface PageContext {
    url: string;
    title: string;
    headings: string[];
    content: string;
    selectedText?: string;
}

export type AITask =
    | "explain"
    | "simplify"
    | "summarize"
    | "ask"
    | "quiz"
    | "connect-concepts";

export type Difficulty = "beginner" | "intermediate" | "expert";

export interface AIRequest {
    task: AITask;
    context: PageContext;
    question?: string;
    difficulty?: Difficulty;
    signal?: AbortSignal;
}

export interface Reference {
    snippet: string;
    heading?: string;
}

export interface AIResponse {
    text: string;
    source: "on-device" | "cloud";
    task: AITask;
    references?: Reference[];
    fallbackReason?: string;
}

export type AIErrorCode =
    | "unavailable"
    | "quota"
    | "app-check-failed"
    | "context-too-large"
    | "aborted"
    | "unknown";

export interface AIError {
    code: AIErrorCode;
    message: string;
}

export interface AIService {
    generateResponse(request: AIRequest): Promise<AIResponse>;
}