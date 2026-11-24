
import { beforeEach, describe, expect, it, vi } from "vitest";
import { explainPage } from "../../src/ai/services/explanation.service";
import { askGemini } from "../../src/ai/models/gemini";
import type { AIRequest, PageContext } from "../../src/core/types/ai";

// Replace the real Gemini integration with a mock.
// These tests will never make actual API requests.
vi.mock("../../src/ai/models/gemini", () => ({
    askGemini: vi.fn(),
}));

const mockedAskGemini = vi.mocked(askGemini);

const validContext: PageContext = {
    url: "https://example.com/article",
    title: "Example Article",
    domain: "example.com",
    headings: ["Introduction", "Main Topic"],
    content: "This article explains machine learning and supervised learning.",
    selectedText: "Supervised learning uses labeled data.",
    extractedAt: Date.now(),
};

const createRequest = (
    overrides: Partial<AIRequest> = {}
): AIRequest => ({
    task: "explain",
    context: validContext,
    ...overrides,
});

describe("explainPage", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should return a successful cloud response", async () => {
        mockedAskGemini.mockResolvedValue(
            "Supervised learning uses labeled examples."
        );

        const response = await explainPage(createRequest());

        expect(response.answer).toBe(
            "Supervised learning uses labeled examples."
        );
        expect(response.task).toBe("explain");
        expect(response.inference.source).toBe("cloud");
        expect(response.inference.requestedMode).toBe("auto");
        expect(response.inference.fallbackUsed).toBe(false);
        expect(mockedAskGemini).toHaveBeenCalledOnce();
    });

    it("should reject a missing page context", async () => {
        const request = createRequest({
            context: null as unknown as PageContext,
        });

        await expect(explainPage(request)).rejects.toMatchObject({
            code: "INVALID_REQUEST",
        });

        expect(mockedAskGemini).not.toHaveBeenCalled();
    });

    it("should reject summarization without page content", async () => {
        const request = createRequest({
            task: "summarize",
            context: {
                ...validContext,
                content: "   ",
                selectedText: validContext.selectedText,
            },
        });

        await expect(explainPage(request)).rejects.toMatchObject({
            code: "NO_PAGE_CONTENT",
        });

        expect(mockedAskGemini).not.toHaveBeenCalled();
    });

    it("should reject requests without usable content", async () => {
        const request = createRequest({
            context: {
                ...validContext,
                content: " ",
                selectedText: undefined,
            },
        });

        await expect(explainPage(request)).rejects.toMatchObject({
            code: "NO_PAGE_CONTENT",
        });
    });

    it("should reject an empty Ask question", async () => {
        const request = createRequest({
            task: "ask",
            question: "   ",
        });

        await expect(explainPage(request)).rejects.toMatchObject({
            code: "INVALID_REQUEST",
        });

        expect(mockedAskGemini).not.toHaveBeenCalled();
    });

    it("should reject on-device inference when it is not implemented", async () => {
        const request = createRequest({
            inferenceMode: "on-device",
        });

        await expect(explainPage(request)).rejects.toMatchObject({
            code: "MODEL_UNAVAILABLE",
        });

        expect(mockedAskGemini).not.toHaveBeenCalled();
    });

    it("should reject an empty Gemini response", async () => {
        mockedAskGemini.mockResolvedValue("   ");

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "INFERENCE_FAILED",
        });
    });

    it("should classify rate limit errors", async () => {
        mockedAskGemini.mockRejectedValue(
            new Error("429 resource-exhausted")
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "RATE_LIMITED",
        });
    });

    it("should classify authentication errors", async () => {
        mockedAskGemini.mockRejectedValue(
            new Error("permission-denied")
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "AUTHENTICATION_FAILED",
        });
    });

    it("should classify network errors", async () => {
        mockedAskGemini.mockRejectedValue(
            new Error("Failed to fetch")
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "NETWORK_ERROR",
        });
    });

    it("should classify unavailable model errors", async () => {
        mockedAskGemini.mockRejectedValue(
            new Error("Model unavailable")
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "MODEL_UNAVAILABLE",
        });
    });


    it("should classify structured Firebase rate-limit errors", async () => {
        mockedAskGemini.mockRejectedValue(
            Object.assign(new Error("Quota exceeded"), {
                code: "functions/resource-exhausted",
            })
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "RATE_LIMITED",
        });
    });

    it("should classify structured Firebase authentication errors", async () => {
        mockedAskGemini.mockRejectedValue(
            Object.assign(new Error("Access denied"), {
                code: "permission-denied",
            })
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "AUTHENTICATION_FAILED",
        });
    });

    it("should classify structured network errors", async () => {
        mockedAskGemini.mockRejectedValue(
            Object.assign(new Error("Request timed out"), {
                code: "deadline-exceeded",
            })
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "NETWORK_ERROR",
        });
    });


    it("should classify unknown structured errors as inference failures", async () => {
        mockedAskGemini.mockRejectedValue(
            Object.assign(new Error("Unexpected failure"), {
                code: "unknown-error",
            })
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "INFERENCE_FAILED",
        });
    });
});