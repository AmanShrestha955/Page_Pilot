import ReactMarkdown from "react-markdown";
import type { AIResponse } from "../../../core/types/ai";
import { SpeakControls } from "./SpeakControls";

const iconProps = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
};

const DeviceIcon = () => (
    <svg {...iconProps}>
        <rect x="4" y="5" width="16" height="11" rx="2" />
        <path d="M2 19h20" />
    </svg>
);

const CloudIcon = () => (
    <svg {...iconProps}>
        <path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9a4.5 4.5 0 0 1 0 9H7z" />
    </svg>
);

const MODE_LABEL = { auto: "Auto", "on-device": "On device", cloud: "Cloud" } as const;

function describe(inf: AIResponse["inference"]) {
    if (inf.source === "on-device") {
        return {
            tone: "text-device",
            icon: <DeviceIcon />,
            title: "Answered on your device",
            detail: "The page text stayed on this device.",
        };
    }
    if (inf.fallbackUsed) {
        return {
            tone: "text-warn",
            icon: <CloudIcon />,
            title: "Answered in the cloud",
            detail:
                "On-device processing wasn't available for this request, so PagePilot used the cloud.",
        };
    }
    return {
        tone: "text-cloud",
        icon: <CloudIcon />,
        title: "Answered in the cloud",
        detail: "The page text was sent to the cloud model to write this answer.",
    };
}

export function AnswerCard({ response }: { response: AIResponse }) {
    const note = describe(response.inference);
    const refs = response.references ?? [];

    return (
        <article className="rounded-xl bg-paper ring-1 ring-line">
            <SpeakControls key={response.answer} text={response.answer} />
            <div className="p-4">
                <div className="space-y-3 font-serif text-[15px] leading-[1.7] [&_:is(h1,h2,h3)]:mt-5 [&_:is(h1,h2,h3)]:font-sans [&_:is(h1,h2,h3)]:text-sm [&_:is(h1,h2,h3)]:font-semibold [&_li+li]:mt-1.5 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
                    <ReactMarkdown>{response.answer}</ReactMarkdown>
                </div>
            </div>

            {refs.length > 0 && (
                <details className="border-t border-line px-4 py-3">
                    <summary className="cursor-pointer text-xs font-medium text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-ink">
                        Passages from the page ({refs.length})
                    </summary>
                    <div className="mt-3 space-y-3">
                        {refs.map((r, i) => (
                            <div key={i} className="space-y-1">
                                {r.heading && (
                                    <p className="text-xs font-semibold">{r.heading}</p>
                                )}
                                {r.excerpt && (
                                    <p className="font-serif text-sm leading-relaxed">
                                        <mark className="box-decoration-clone rounded-sm bg-mark/60 px-0.5 text-ink">
                                            {r.excerpt}
                                        </mark>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </details>
            )}

            <footer className="flex gap-2.5 border-t border-line px-4 py-3">
                <span className={"mt-0.5 " + note.tone}>{note.icon}</span>
                <div className="text-xs">
                    <p className={"font-semibold " + note.tone}>{note.title}</p>
                    <p className="mt-0.5 text-muted">{note.detail}</p>
                    <p className="mt-0.5 text-muted">
                        Processing setting: {MODE_LABEL[response.inference.requestedMode]}
                    </p>
                </div>
            </footer>
        </article>
    );
}