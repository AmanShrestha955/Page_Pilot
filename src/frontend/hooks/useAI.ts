import { useCallback, useState } from "react";
import type { AIRequest, AIResponse } from "../../core/types/ai";
import { aiService } from "../services/ai-service";

export function useAI() {
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const run = useCallback(async (request: AIRequest) => {
        setLoading(true);
        setError(null);
        try {
            setResponse(await aiService.generateResponse(request));
        } catch (e) {
            console.error("PagePilot AI request failed:", e);
            setResponse(null);
            setError(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }, []);

    return { response, error, loading, run };
}