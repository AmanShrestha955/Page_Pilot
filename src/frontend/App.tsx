import { useState } from "react";
import { usePageContext } from "./hooks/usePageContext";
import { explainPage } from "../ai/services/explanation.service";
import type { AIResponse, Difficulty, InferenceMode } from "../core/types/ai";
import ReactMarkdown from "react-markdown";

export default function App() {
    const { context, error, loading, refresh } = usePageContext();

    const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
    const [mode, setMode] = useState<InferenceMode>("auto");

    const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const busy = loading || aiLoading;

    async function handleExplain() {
        setAiLoading(true);
        setAiError(null);
        setAiResponse(null);

        try {
            // Re-read the page so the latest selection is included.
            const pageContext = await refresh();
            if (!pageContext) return;

            const response = await explainPage({
                task: "explain",
                context: pageContext,
                difficulty,
                inferenceMode: mode,
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
        <div className="space-y-4 p-4 text-sm">
            <h1 className="text-xl font-semibold">PagePilot</h1>

            <div className="flex gap-2">
                <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    disabled={busy}
                    className="rounded border px-2 py-1"
                >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Expert</option>
                </select>

                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as InferenceMode)}
                    disabled={busy}
                    className="rounded border px-2 py-1"
                >
                    <option value="auto">Auto</option>
                    <option value="on-device">On-device</option>
                    <option value="cloud">Cloud</option>
                </select>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => refresh()}
                    disabled={busy}
                    className="rounded bg-gray-700 px-3 py-2 text-white disabled:opacity-50"
                >
                    {loading ? "Reading..." : "Read this page"}
                </button>

                <button
                    onClick={handleExplain}
                    disabled={busy}
                    className="flex-1 rounded bg-black px-3 py-2 text-white disabled:opacity-50"
                >
                    {aiLoading ? "Explaining..." : "Explain"}
                </button>
            </div>

            {error && <p className="text-red-600">{error}</p>}

            {context && (
                <div className="space-y-1 rounded border p-3">
                    <p className="font-semibold">{context.title}</p>
                    <p className="text-xs text-gray-500">
                        {context.domain} · {context.headings.length} headings ·{" "}
                        {context.content.length} characters
                    </p>
                    <p className="text-xs">
                        <b>Selected:</b> {context.selectedText || "None (whole page)"}
                    </p>
                </div>
            )}

            {aiError && (
                <div className="rounded border border-red-300 p-3 text-red-600">
                    {aiError}
                </div>
            )}

            {aiResponse && (
                <div className="space-y-3 border-t pt-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded bg-gray-200 px-2 py-0.5">
                            {aiResponse.inference.source === "on-device"
                                ? "On-device"
                                : "Cloud"}
                        </span>
                        <span className="text-gray-500">
                            Requested: {aiResponse.inference.requestedMode}
                        </span>
                        {aiResponse.inference.fallbackUsed && (
                            <span className="rounded bg-amber-200 px-2 py-0.5">
                                Fell back to cloud
                            </span>
                        )}
                    </div>

                    <div className="whitespace-pre-wrap leading-relaxed">
                        <div className="space-y-2 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_h3]:font-semibold [&_h3]:mt-3 [&_strong]:font-semibold">
                            <ReactMarkdown>{aiResponse.answer}</ReactMarkdown>
                        </div>
                    </div>

                    {aiResponse.references && aiResponse.references.length > 0 && (
                        <div className="space-y-1">
                            <h3 className="text-xs font-semibold uppercase text-gray-500">
                                From the page
                            </h3>
                            {aiResponse.references.map((r, i) => (
                                <blockquote
                                    key={i}
                                    className="border-l-2 pl-2 text-xs text-gray-600"
                                >
                                    {r.heading && <b>{r.heading}: </b>}
                                    {r.excerpt}
                                </blockquote>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}