import { useEffect, useState } from "react";
import { usePageContext } from "./hooks/usePageContext";
import { explainPage } from "../ai/services/explanation.service";
import type { AIResponse, Difficulty } from "../core/types/ai";
import { Segmented } from "./components/common/Segmented";
import { AnswerCard } from "./components/chat/AnswerCard";

const LEVELS: { value: Difficulty; label: string }[] = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Expert" },
];

// Matches the extraction limit in extract-page.ts
const EXTRACT_LIMIT = 30000;

function friendlyError(e: unknown): string {
    const msg = e instanceof Error ? e.message : "";
    if (/high demand|\[5\d\d\]|\b50[03]\b/.test(msg)) {
        return "The AI service is busy. Wait a moment, then try again.";
    }
    if (/network|fetch/i.test(msg)) {
        return "PagePilot couldn't reach the AI service. Check your connection, then try again.";
    }
    return "Something went wrong while writing the explanation. Try again.";
}

export default function App() {
    const { context, error, loading, refresh } = usePageContext();

    const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");

    const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const busy = loading || aiLoading;
    const hasSelection = !!context?.selectedText;

    // Read the page as soon as the panel opens.
    useEffect(() => {
        void refresh();
    }, [refresh]);

    async function handleExplain() {
        setAiLoading(true);
        setAiError(null);
        setAiResponse(null);

        try {
            // Re-read so the latest selection is included.
            const pageContext = await refresh();
            if (!pageContext) return;

            const response = await explainPage({
                task: "explain",
                context: pageContext,
                difficulty,
                inferenceMode: "auto",
            });

            setAiResponse(response);
        } catch (e) {
            console.error("PagePilot explanation failed:", e);
            setAiError(friendlyError(e));
        } finally {
            setAiLoading(false);
        }
    }

    return (
        <div className="flex h-screen flex-col bg-canvas text-sm text-ink">
            <header className="flex items-center gap-2 border-b border-line bg-paper px-4 py-3">
                <img src="/icon.png" alt="" className="size-6 rounded" />
                <h1 className="text-[15px] font-semibold tracking-tight">PagePilot</h1>
            </header>

            <main className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                {/* Current page */}
                {context && (
                    <section aria-label="Current page">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="truncate text-xs text-muted">{context.domain}</p>
                            <button
                                onClick={() => refresh()}
                                disabled={busy}
                                className="shrink-0 text-xs font-medium text-muted underline-offset-2 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-50"
                            >
                                {loading ? "Reading" : "Refresh"}
                            </button>
                        </div>

                        <h2 className="mt-1 line-clamp-3 font-serif text-lg font-medium leading-snug">
                            {context.title}
                        </h2>
                        <p className="mt-1 text-xs text-muted">
                            {context.headings.length} sections,{" "}
                            {context.content.length.toLocaleString()} characters read
                        </p>

                        {context.content.length >= EXTRACT_LIMIT && (
                            <p className="mt-2 text-xs text-warn">
                                Long page. PagePilot reads the first{" "}
                                {EXTRACT_LIMIT.toLocaleString()} characters.
                            </p>
                        )}

                        {hasSelection ? (
                            <div className="mt-4">
                                <p className="mb-1 text-xs font-medium text-muted">
                                    Selected text
                                </p>
                                <p className="line-clamp-4 font-serif text-[15px] leading-relaxed">
                                    <mark className="box-decoration-clone rounded-sm bg-mark/70 px-0.5 text-ink">
                                        {context.selectedText}
                                    </mark>
                                </p>
                            </div>
                        ) : (
                            <p className="mt-4 text-xs text-muted">
                                Nothing selected. PagePilot will explain the whole page.
                            </p>
                        )}
                    </section>
                )}

                {/* Page could not be read */}
                {error && (
                    <div
                        role="alert"
                        className="rounded-md border-l-2 border-danger bg-paper p-3 ring-1 ring-line"
                    >
                        <p className="font-medium">PagePilot can't read this page</p>
                        <p className="mt-1 text-muted">
                            Browser pages, the Chrome Web Store and PDFs can't be read. On
                            other pages, reload the tab and check again.
                        </p>
                        <button
                            onClick={() => refresh()}
                            disabled={busy}
                            className="mt-2 text-xs font-medium underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-50"
                        >
                            Check again
                        </button>
                    </div>
                )}

                {/* Explanation failed */}
                {aiError && (
                    <div
                        role="alert"
                        className="rounded-md border-l-2 border-danger bg-paper p-3 ring-1 ring-line"
                    >
                        <p className="font-medium">Couldn't get an explanation</p>
                        <p className="mt-1 text-muted">{aiError}</p>
                        <button
                            onClick={handleExplain}
                            disabled={busy}
                            className="mt-2 text-xs font-medium underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-50"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Loading */}
                <div aria-live="polite">
                    {aiLoading && (
                        <div className="space-y-2.5 rounded-xl bg-paper p-4 ring-1 ring-line">
                            <div className="h-3 w-full rounded bg-line motion-safe:animate-pulse" />
                            <div className="h-3 w-11/12 rounded bg-line motion-safe:animate-pulse" />
                            <div className="h-3 w-4/5 rounded bg-line motion-safe:animate-pulse" />
                            <div className="h-3 w-2/3 rounded bg-line motion-safe:animate-pulse" />
                        </div>
                    )}
                </div>

                {/* Answer */}
                {aiResponse && <AnswerCard response={aiResponse} />}

                {/* Empty state */}
                {!aiResponse && !aiLoading && !aiError && !error && (
                    <div className="space-y-1.5 text-muted">
                        <p className="font-serif text-base text-ink">
                            Highlight a passage to get it explained.
                        </p>
                        <p className="leading-relaxed">
                            Leave nothing selected to explain the whole page. Choose a level
                            that matches what you already know.
                        </p>
                    </div>
                )}
            </main>

            {/* Controls and primary action */}
            <footer className="space-y-3 border-t border-line bg-paper p-3">
                <Segmented
                    label="Level"
                    value={difficulty}
                    options={LEVELS}
                    onChange={setDifficulty}
                    disabled={busy}
                />

                <button
                    onClick={handleExplain}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
                >
                    {aiLoading && (
                        <span className="size-4 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin" />
                    )}
                    {aiLoading
                        ? "Writing explanation"
                        : hasSelection
                            ? "Explain selection"
                            : "Explain page"}
                </button>

                <p className="text-center text-xs text-muted">
                    The page text is sent to a cloud AI model to write the explanation.
                </p>
            </footer>
        </div>
    );
}