import type { AIRequest, AIResponse } from "../../core/types/ai";
import { MockAIService } from "../mocks/mock-ai-service";

export interface AIService {
    generateResponse(request: AIRequest): Promise<AIResponse>;
}

// When his real service is ready, swap this one line.
export const aiService: AIService = new MockAIService();