import { useState } from "react";
import { usePageContext } from "./hooks/usePageContext";
import { usePageWatcher } from "./hooks/usePageWatcher";
import { explainPage } from "../ai/services/explanation.service";
import type { AIResponse, AITask, Difficulty } from "../core/types/ai";
import { Segmented } from "./components/common/Segmented";
import { TaskTabs } from "./components/common/TaskTabs";
import { AnswerCard } from "./components/chat/AnswerCard";

const LEVELS: { value: Difficulty; label: string }[] = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Expert" },
];

const TASKS: Record<
    AITask,
    { tab: string; verb: string; working: string; emptyTitle: string; emptyBody: string }
> = {
    explain: {
        tab: "Explain",
        verb: "Explain",
        working: "Explaining",
        emptyTitle: "Highlight a passage to get it explained.",
        emptyBody:
            "Leave nothing selected to explain the whole page. Choose a level that matches what you already know.",
    },
    simplify: {
        tab: "Simplify",
        verb: "Simplify",
        working: "Simplifying",
        emptyTitle: "Highlight a hard paragraph to rewrite it in plainer language.",
        emptyBody: "Leave nothing selected to simplify the whole page.",
    },
    summarize: {
        tab: "Summarize",
        verb: "Summarize",
        working: "Summarizing",
        emptyTitle: "Get the main points of this page.",
        emptyBody: "Highlight a section to summarize just that part.",
    },
    ask: {
        tab: "Ask",
        verb: "Ask",
        working: "Finding the answer",
        emptyTitle: "Ask a question about this page.",
        emptyBody: "Type it below. The answer uses the text of the page you're reading.",
    },
};

const TAB_LIST = (Object.keys(TASKS) as AITask[]).map((t) => ({
    value: t,
    label: TASKS[t].tab,
}));

// Matches the extraction limit in extract-page.ts
const EXTRACT_LIMIT = 30000;

// A result belongs to the page it was produced for.
interface Outcome {
    url: string;
    question: string | null;
    response?: AIResponse;
    error?: string;
}

function friendlyError(e: unknown): string {
    const msg = e instanceof Error ? e.message : "";
    if (/high demand|\[5\d\d\]|\b50[03]\b/.test(msg)) {
        return "The AI service is busy. Wait a moment, then try again.";
    }
    if (/network|fetch/i.test(msg)) {
        return "PagePilot couldn't reach the AI service. Check your connection, then try again.";
    }
    return "Something went wrong. Try again.";
}

export default function App() {
    const { context, error, loading, refresh } = usePageContext();
    usePageWatcher(refresh);

    const [task, setTask] = useState<AITask>("explain");
    const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
    const [question, setQuestion] = useState("");

    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Only show a result while the user is still on the page it was made for.
    const current = outcome && outcome.url === context?.url ? outcome : null;

    const busy = loading || aiLoading;
    const hasSelection = !!context?.selectedText;
    const isAsk = task === "ask";
    const canRun = !busy && (!isAsk || question.trim().length > 0);

    function selectTask(next: AITask) {
        if (busy) return;
        setTask(next);
        setOutcome(null);
    }

    async function handleRun() {
        const q = question.trim();
        if (isAsk && !q) return;

        setAiLoading(true);
        setOutcome(null);
        let pageUrl: string | null = null;

        try {
            // Re-read so the latest selection is included.
            const pageContext = await refresh();
            if (!pageContext) return;
            pageUrl = pageContext.url;

            const response = await explainPage({
                task,
                context: pageContext,
                difficulty,
                inferenceMode: "auto",
                ...(isAsk ? { question: q } : {}),
            });

            setOutcome({ url: pageUrl, question: isAsk ? q : null, response });
        } catch (e) {
            console.error(`PagePilot ${task} failed:`, e);
            if (pageUrl) {
                setOutcome({ url: pageUrl, question: null, error: friendlyError(e) });
            }
        } finally {
            setAiLoading(false);
        }
    }

    const buttonLabel = aiLoading
        ? TASKS[task].working
        : isAsk
            ? "Ask"
            : `${TASKS[task].verb} ${hasSelection ? "selection" : "page"}`;

    return (
        <div className="flex h-screen flex-col bg-canvas text-sm text-ink">
            <header className="flex items-center gap-2 bg-paper px-4 pb-1 pt-3">
                <img src="/icon.png" alt="" className="size-6 rounded" />
                <h1 className="text-[15px] font-semibold tracking-tight">PagePilot</h1>
            </header>

            <TaskTabs value={task} tabs={TAB_LIST} onChange={selectTask} disabled={busy} />

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
                                Nothing selected. PagePilot will use the whole page.
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

                {/* Request failed */}
                {current?.error && (
                    <div
                        role="alert"
                        className="rounded-md border-l-2 border-danger bg-paper p-3 ring-1 ring-line"
                    >
                        <p className="font-medium">Couldn't get a response</p>
                        <p className="mt-1 text-muted">{current.error}</p>
                        <button
                            onClick={handleRun}
                            disabled={!canRun}
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
                {current?.response && (
                    <div className="space-y-3">
                        {current.question && (
                            <p className="font-serif text-base font-medium leading-snug">
                                {current.question}
                            </p>
                        )}
                        <AnswerCard response={current.response} />
                    </div>
                )}

                {/* Empty state */}
                {!current && !aiLoading && !error && (
                    <div className="space-y-1.5 text-muted">
                        <p className="font-serif text-base text-ink">
                            {TASKS[task].emptyTitle}
                        </p>
                        <p className="leading-relaxed">{TASKS[task].emptyBody}</p>
                    </div>
                )}
            </main>

            {/* Input and primary action */}
            <footer className="space-y-3 border-t border-line bg-paper p-3">
                {isAsk && (
                    <div>
                        <label htmlFor="question" className="sr-only">
                            Your question
                        </label>
                        <textarea
                            id="question"
                            rows={2}
                            maxLength={500}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (canRun) void handleRun();
                                }
                            }}
                            disabled={busy}
                            placeholder="Ask a question about this page"
                            className="w-full resize-none rounded-lg bg-paper px-3 py-2 text-sm ring-1 ring-line placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink disabled:opacity-60"
                        />
                    </div>
                )}

                <Segmented
                    label="Level"
                    value={difficulty}
                    options={LEVELS}
                    onChange={setDifficulty}
                    disabled={busy}
                />

                <button
                    onClick={handleRun}
                    disabled={!canRun}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
                >
                    {aiLoading && (
                        <span className="size-4 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin" />
                    )}
                    {buttonLabel}
                </button>

                <p className="text-center text-xs text-muted">
                    The page text is sent to a cloud AI model to write the response.
                </p>
            </footer>
        </div>
    );
}