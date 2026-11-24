import type { AIRequest, AIResponse, InferenceSource } from "../../core/types/ai";
import type { AIService } from "../services/ai-service";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MockAIService implements AIService {
    async generateResponse(request: AIRequest): Promise<AIResponse> {
        await delay(800);

        const mode = request.inferenceMode ?? "auto";
        const hasSelection = !!request.context.selectedText;

        // Fake routing so you can design all three badge states
        let source: InferenceSource;
        let fallbackUsed = false;
        if (mode === "on-device") source = "on-device";
        else if (mode === "cloud") source = "cloud";
        else if (hasSelection) source = "on-device";
        else {
            source = "cloud";
            fallbackUsed = true;
        }

        const subject = request.context.selectedText ?? request.context.title;
        return {
            answer: `[MOCK ${request.difficulty ?? "beginner"} ${request.task}] Here is a sample explanation of: "${subject.slice(0, 120)}"`,
            task: request.task,
            inference: { source, requestedMode: mode, fallbackUsed },
            references: [
                {
                    heading: request.context.headings[0],
                    excerpt: request.context.content.slice(0, 120),
                },
            ],
        };
    }
}
