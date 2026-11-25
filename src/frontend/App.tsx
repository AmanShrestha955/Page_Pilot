import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { usePageContext } from "./hooks/usePageContext";
import { explainPage } from "../ai/services/explanation.service";
import type { AIResponse, Difficulty, InferenceMode } from "../core/types/ai";

function friendlyError(e: unknown): string {
    const msg = e instanceof Error ? e.message : "";
    if (/high demand|\[5\d\d\]|\b50[03]\b/.test(msg)) {
        return "The AI service is busy right now. Please try again in a moment.";
    }
    if (/network|fetch/i.test(msg)) {
        return "Couldn't reach the AI service. Check your connection and try again.";
    }
    return "Something went wrong while explaining this page. Please try again.";
}

const selectClass =
    "w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50";

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
            setAiError(friendlyError(e));
        } finally {
            setAiLoading(false);
        }
    }

    const hasSelection = !!context?.selectedText;

    return (
        <div className="min-h-screen bg-gray-50 text-sm text-gray-800">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
                <img src="/icon.png" alt="" className="h-6 w-6 rounded" />
                <h1 className="text-base font-semibold tracking-tight">PagePilot</h1>
                <span className="ml-auto text-xs text-gray-500">Learning companion</span>
            </header>

            <main className="space-y-4 p-4">
                {/* Controls */}
                <section className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                        <span className="text-xs font-medium text-gray-500">Level</span>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                            disabled={busy}
                            className={selectClass}
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Expert</option>
                        </select>
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs font-medium text-gray-500">Processing</span>
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as InferenceMode)}
                            disabled={busy}
                            className={selectClass}
                        >
                            <option value="auto">Auto</option>
                            <option value="on-device">On-device</option>
                            <option value="cloud">Cloud</option>
                        </select>
                    </label>
                </section>

                {/* Actions */}
                <section className="flex gap-2">
                    <button
                        onClick={() => refresh()}
                        disabled={busy}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        {loading ? "Reading…" : "Read page"}
                    </button>
                    <button
                        onClick={handleExplain}
                        disabled={busy}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {aiLoading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        )}
                        {aiLoading ? "Explaining…" : "Explain"}
                    </button>
                </section>
                <p className="-mt-2 text-xs text-gray-500">
                    Select text on the page to explain just that part, or leave nothing selected to explain the whole page.
                </p>

                {/* Page read error */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                        {error}
                    </div>
                )}

                {/* Page card */}
                {context && (
                    <section className="space-y-1.5 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                        <p className="line-clamp-2 font-semibold leading-snug">{context.title}</p>
                        <p className="text-xs text-gray-500">
                            {context.domain} · {context.headings.length} headings ·{" "}
                            {context.content.length.toLocaleString()} characters
                        </p>
                        <p className="text-xs">
                            <span
                                className={
                                    "rounded-full px-2 py-0.5 font-medium " +
                                    (hasSelection
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "bg-gray-100 text-gray-600")
                                }
                            >
                                {hasSelection ? "Selection" : "Whole page"}
                            </span>
                        </p>
                        {hasSelection && (
                            <p className="line-clamp-3 border-l-2 border-indigo-300 pl-2 text-xs italic text-gray-600">
                                {context.selectedText}
                            </p>
                        )}
                    </section>
                )}

                {/* AI error */}
                {aiError && (
                    <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                        <p>{aiError}</p>
                        <button
                            onClick={handleExplain}
                            disabled={busy}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Loading skeleton */}
                {aiLoading && (
                    <div className="animate-pulse space-y-2 rounded-xl border border-gray-200 bg-white p-4">
                        <div className="h-3 w-1/3 rounded bg-gray-200" />
                        <div className="h-3 w-full rounded bg-gray-200" />
                        <div className="h-3 w-5/6 rounded bg-gray-200" />
                        <div className="h-3 w-2/3 rounded bg-gray-200" />
                    </div>
                )}

                {/* Result */}
                {aiResponse && (
                    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span
                                className={
                                    "rounded-full px-2.5 py-0.5 font-medium " +
                                    (aiResponse.inference.source === "on-device"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-sky-100 text-sky-700")
                                }
                            >
                                {aiResponse.inference.source === "on-device"
                                    ? "Processed on-device"
                                    : "Processed in the cloud"}
                            </span>
                            <span className="text-gray-500">
                                Requested: {aiResponse.inference.requestedMode}
                            </span>
                            {aiResponse.inference.fallbackUsed && (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-700">
                                    Fell back to cloud
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 leading-relaxed [&_h1]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
                            <ReactMarkdown>{aiResponse.answer}</ReactMarkdown>
                        </div>

                        {aiResponse.references && aiResponse.references.length > 0 && (
                            <details className="rounded-lg bg-gray-50 p-2">
                                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    From the page ({aiResponse.references.length})
                                </summary>
                                <div className="mt-2 space-y-2">
                                    {aiResponse.references.map((r, i) => (
                                        <blockquote
                                            key={i}
                                            className="border-l-2 border-gray-300 pl-2 text-xs text-gray-600"
                                        >
                                            {r.heading && <b>{r.heading}: </b>}
                                            {r.excerpt}
                                        </blockquote>
                                    ))}
                                </div>
                            </details>
                        )}
                    </section>
                )}

                {/* Empty state */}
                {!context && !aiResponse && !aiLoading && !error && !aiError && (
                    <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                        Open an article, then click <b>Explain</b> to get a clear, level-appropriate explanation.
                    </div>
                )}

                {/* Privacy note */}
                <p className="pb-2 text-center text-xs text-gray-400">
                    Processing may happen on your device or in the cloud, depending on your browser and device.
                </p>
            </main>
        </div>
    );
}