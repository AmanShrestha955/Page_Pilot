/**
 * Conservative character budget for local inference.
 *
 * This is a heuristic, NOT a guaranteed Gemini Nano token limit.
 * The complete prompt is measured because instructions and metadata
 * also consume the model's context window.
 */
export const MAX_ON_DEVICE_PROMPT_CHARS = 8_000;

export interface ContextBudget {
    characterCount: number;
    maxCharacters: number;
    fitsOnDevice: boolean;
}

export function assessContextBudget(
    prompt: string,
    maxCharacters = MAX_ON_DEVICE_PROMPT_CHARS
): ContextBudget {
    const characterCount = prompt.length;

    return {
        characterCount,
        maxCharacters,
        fitsOnDevice: characterCount <= maxCharacters,
    };
}