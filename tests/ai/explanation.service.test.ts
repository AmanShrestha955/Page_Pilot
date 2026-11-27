
import { beforeEach, describe, expect, it, vi } from "vitest";
import { explainPage } from "../../src/ai/services/explanation.service";
import { generateHybridGemini } from "../../src/ai/models/gemini";
import type { AIRequest, PageContext } from "../../src/core/types/ai";

// Replace the real Gemini integration with a mock.
// These tests will never make actual API requests.
vi.mock("../../src/ai/models/gemini", () => ({
    generateHybridGemini: vi.fn(),
}));

const mockedGenerateHybridGemini = vi.mocked(generateHybridGemini);

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

const createFirebaseError = (
    code: string,
    status?: number,
    errorDetails?: unknown[]
) =>
    Object.assign(new Error("Firebase request failed"), {
        code,
        customErrorData:
            status === undefined && errorDetails === undefined
                ? undefined
                : {
                    status,
                    errorDetails,
                },
    });

describe("explainPage", () => {
    beforeEach(() => {
        vi.resetAllMocks();

        mockedGenerateHybridGemini.mockResolvedValue({
            text: "Supervised learning uses labeled examples.",
            source: "cloud",
        });
    });

    it("should return a successful on-device response", async () => {
        mockedGenerateHybridGemini.mockResolvedValue({
            text: "Supervised learning uses labeled examples.",
            source: "on-device",
        });

        const response = await explainPage(createRequest());

        expect(response.answer).toBe(
            "Supervised learning uses labeled examples."
        );
        expect(response.task).toBe("explain");
        expect(response.inference.source).toBe("on-device");
        expect(response.inference.requestedMode).toBe("auto");
        expect(response.inference.fallbackUsed).toBe(false);

        expect(mockedGenerateHybridGemini).toHaveBeenCalledOnce();
        expect(mockedGenerateHybridGemini).toHaveBeenCalledWith(
            expect.any(String),
            "auto"
        );
    });

    it("should report cloud fallback when auto inference returns cloud", async () => {
        mockedGenerateHybridGemini.mockResolvedValue({
            text: "Cloud-generated explanation.",
            source: "cloud",
        });

        const response = await explainPage(createRequest());

        expect(response.inference.source).toBe("cloud");
        expect(response.inference.requestedMode).toBe("auto");
        expect(response.inference.fallbackUsed).toBe(true);
    });

    it("should reject a missing page context", async () => {
        const request = createRequest({
            context: null as unknown as PageContext,
        });

        await expect(explainPage(request)).rejects.toMatchObject({
            code: "INVALID_REQUEST",
        });

        expect(mockedGenerateHybridGemini).not.toHaveBeenCalled();
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

        expect(mockedGenerateHybridGemini).not.toHaveBeenCalled();
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

        expect(mockedGenerateHybridGemini).not.toHaveBeenCalled();
    });

    it("should reject an empty Ask question", async () => {
        const request = createRequest({
            task: "ask",
            question: "   ",
        });

        await expect(explainPage(request)).rejects.toMatchObject({
            code: "INVALID_REQUEST",
        });

        expect(mockedGenerateHybridGemini).not.toHaveBeenCalled();
    });

    it("should support strict on-device inference", async () => {
        mockedGenerateHybridGemini.mockResolvedValue({
            text: "Supervised learning uses labeled examples.",
            source: "on-device",
        });

        const response = await explainPage(
            createRequest({ inferenceMode: "on-device" })
        );

        expect(response.inference.source).toBe("on-device");
        expect(response.inference.requestedMode).toBe("on-device");
        expect(response.inference.fallbackUsed).toBe(false);

        expect(mockedGenerateHybridGemini).toHaveBeenCalledWith(
            expect.any(String),
            "on-device"
        );
    });

    it("should support cloud-only inference", async () => {
        const response = await explainPage(
            createRequest({ inferenceMode: "cloud" })
        );

        expect(response.inference.source).toBe("cloud");
        expect(response.inference.requestedMode).toBe("cloud");
        expect(response.inference.fallbackUsed).toBe(false);

        expect(mockedGenerateHybridGemini).toHaveBeenCalledWith(
            expect.any(String),
            "cloud"
        );
    });

    it("should route oversized auto-mode prompts directly to cloud", async () => {
        const request = createRequest({
            context: {
                ...validContext,
                content: "Machine learning ".repeat(600),
                selectedText: undefined,
            },
        });

        const response = await explainPage(request);

        expect(mockedGenerateHybridGemini).toHaveBeenCalledWith(
            expect.any(String),
            "cloud"
        );

        expect(response.inference.source).toBe("cloud");
        expect(response.inference.fallbackUsed).toBe(false);
    });

    it("should route incomplete full-page auto requests directly to cloud", async () => {
        const request = createRequest({
            context: {
                ...validContext,
                selectedText: undefined,
                truncated: true,
            },
        });

        const response = await explainPage(request);

        expect(mockedGenerateHybridGemini).toHaveBeenCalledWith(
            expect.any(String),
            "cloud"
        );

        expect(response.inference.source).toBe("cloud");
        expect(response.inference.fallbackUsed).toBe(false);

        const prompt = mockedGenerateHybridGemini.mock.calls[0][0];

        expect(prompt).toContain("INCOMPLETE WEBPAGE EXTRACTION");
    });

    it("should reject oversized prompts in strict on-device mode", async () => {
        const request = createRequest({
            inferenceMode: "on-device",
            context: {
                ...validContext,
                content: "Machine learning ".repeat(600),
                selectedText: undefined,
            },
        });

        await expect(explainPage(request)).rejects.toMatchObject({
            code: "CONTEXT_TOO_LARGE",
        });

        expect(mockedGenerateHybridGemini).not.toHaveBeenCalled();
    });

    it("should reject incomplete full-page context in strict on-device mode", async () => {
        const request = createRequest({
            inferenceMode: "on-device",
            context: {
                ...validContext,
                selectedText: undefined,
                truncated: true,
            },
        });

        await expect(explainPage(request)).rejects.toMatchObject({
            code: "INCOMPLETE_CONTEXT",
        });

        expect(mockedGenerateHybridGemini).not.toHaveBeenCalled();
    });

    it("should allow on-device explanation of selected text from a truncated page", async () => {
        mockedGenerateHybridGemini.mockResolvedValue({
            text: "The selected passage explains supervised learning.",
            source: "on-device",
        });

        const request = createRequest({
            context: {
                ...validContext,
                truncated: true,
                selectedText: "Supervised learning uses labeled data.",
            },
        });

        const response = await explainPage(request);

        expect(response.inference.source).toBe("on-device");

        expect(mockedGenerateHybridGemini).toHaveBeenCalledWith(
            expect.any(String),
            "auto"
        );

        const prompt = mockedGenerateHybridGemini.mock.calls[0][0];

        expect(prompt).not.toContain("INCOMPLETE WEBPAGE EXTRACTION");
    });

    it("should reject an empty Gemini response", async () => {
        mockedGenerateHybridGemini.mockResolvedValue({
            text: "   ",
            source: "on-device",
        });

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "INFERENCE_FAILED",
        });
    });

    it("should classify rate limit errors", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            new Error("429 resource-exhausted")
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "RATE_LIMITED",
        });
    });

    it("should classify authentication errors", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            new Error("permission-denied")
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "AUTHENTICATION_FAILED",
        });
    });

    it("should classify network errors", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            new Error("Failed to fetch")
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "NETWORK_ERROR",
        });
    });

    it("should classify unavailable model errors", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            new Error("Model unavailable")
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "MODEL_UNAVAILABLE",
        });
    });

    it("should classify structured Firebase rate-limit errors", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            Object.assign(new Error("Quota exceeded"), {
                code: "functions/resource-exhausted",
            })
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "RATE_LIMITED",
        });
    });

    it("should classify structured Firebase authentication errors", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            Object.assign(new Error("Access denied"), {
                code: "permission-denied",
            })
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "AUTHENTICATION_FAILED",
        });
    });

    it("should classify structured network errors", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            Object.assign(new Error("Request timed out"), {
                code: "deadline-exceeded",
            })
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "NETWORK_ERROR",
        });
    });

    it("should classify unknown structured errors as inference failures", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            Object.assign(new Error("Unexpected failure"), {
                code: "unknown-error",
            })
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "INFERENCE_FAILED",
        });
    });

    // Firebase AI Logic customErrorData tests.

    it("should classify HTTP 429 as rate limited", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            createFirebaseError("fetch-error", 429)
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "RATE_LIMITED",
        });
    });

    it("should classify HTTP 401 as authentication failure", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            createFirebaseError("fetch-error", 401)
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "AUTHENTICATION_FAILED",
        });
    });

    it("should classify HTTP 403 as authentication failure", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            createFirebaseError("fetch-error", 403)
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "AUTHENTICATION_FAILED",
        });
    });

    it("should classify HTTP 500 as inference failure", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            createFirebaseError("fetch-error", 500)
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "INFERENCE_FAILED",
        });
    });

    it("should classify api-not-enabled as a configuration error", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            createFirebaseError("api-not-enabled")
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "CONFIGURATION_ERROR",
        });
    });

    it("should classify missing API key as a configuration error", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            createFirebaseError("no-api-key")
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "CONFIGURATION_ERROR",
        });
    });

    it("should not classify fetch-error without HTTP status as a network error", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            createFirebaseError("fetch-error")
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "INFERENCE_FAILED",
        });
    });

    it("should handle malformed custom error data safely", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            Object.assign(new Error("Unexpected failure"), {
                code: "fetch-error",
                customErrorData: {
                    status: "429",
                    errorDetails: "invalid",
                },
            })
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "INFERENCE_FAILED",
        });
    });

    it("should classify generic Firebase fetch errors as network errors", async () => {
        mockedGenerateHybridGemini.mockRejectedValue(
            Object.assign(new Error("Failed to fetch"), {
                code: "error",
            })
        );

        await expect(explainPage(createRequest())).rejects.toMatchObject({
            code: "NETWORK_ERROR",
        });
    });
});
