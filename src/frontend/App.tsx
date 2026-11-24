
import { useState } from "react";
import { usePageContext } from "./hooks/usePageContext";
import { explainPage } from "../ai/services/explanation.service";
import type { AIResponse } from "../core/types/ai";

export default function App() {
    const { context, error, loading, refresh } = usePageContext();

    const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    async function handleExplain() {
        setAiLoading(true);
        setAiError(null);
        setAiResponse(null);

        try {
            // Get the latest webpage content.
            const pageContext = await refresh();

            if (!pageContext) {
                return;
            }

            // Send the extracted content to the AI service.
            const response = await explainPage({
                task: "explain",
                context: pageContext,
                difficulty: "intermediate",
                inferenceMode: "auto",
            });

            setAiResponse(response);
        } catch (e) {
            console.error("PagePilot explanation failed:", e);

            setAiError(
                e instanceof Error
                    ? e.message
                    : "Something went wrong while explaining this page."
            );
        } finally {
            setAiLoading(false);
        }
    }

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-semibold">PagePilot</h1>

            <div className="flex gap-2">
                <button
                    onClick={refresh}
                    disabled={loading || aiLoading}
                    className="rounded bg-gray-700 px-3 py-2 text-white disabled:opacity-50"
                >
                    {loading ? "Reading..." : "Read this page"}
                </button>

                <button
                    onClick={handleExplain}
                    disabled={loading || aiLoading}
                    className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
                >
                    {aiLoading ? "Explaining..." : "Explain this page"}
                </button>
            </div>

            {error && (
                <p className="text-red-600 text-sm">{error}</p>
            )}

            {context && (
                <div className="text-sm space-y-2">
                    <h2 className="font-semibold">Page Context</h2>

                    <p><b>Title:</b> {context.title}</p>
                    <p><b>Headings:</b> {context.headings.length}</p>
                    <p><b>Characters:</b> {context.content.length}</p>
                    <p>
                        <b>Selected:</b>{" "}
                        {context.selectedText || "None"}
                    </p>
                </div>
            )}

            {aiError && (
                <div className="rounded border border-red-300 p-3 text-sm text-red-600">
                    {aiError}
                </div>
            )}

            {aiResponse && (
                <div className="space-y-3 border-t pt-4">
                    <div>
                        <h2 className="font-semibold">
                            Page Explanation
                        </h2>

                        <p className="text-xs text-gray-500">
                            Inference: {aiResponse.inference.source}
                        </p>
                    </div>

                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {aiResponse.answer}
                    </div>
                </div>
            )}
        </div>
    );
}
