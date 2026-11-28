import { useSpeech } from "../../hooks/useSpeech";

const icon = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true,
};

const SpeakerIcon = () => (
    <svg {...icon}>
        <path d="M3 9v6h4l5 4V5L7 9H3z" />
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);
const PauseIcon = () => (
    <svg {...icon}>
        <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
);
const PlayIcon = () => (
    <svg {...icon}>
        <path d="M7 4l13 8-13 8z" />
    </svg>
);
const StopIcon = () => (
    <svg {...icon}>
        <path d="M6 6h12v12H6z" />
    </svg>
);

const buttonClass =
    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ink ring-1 ring-line " +
    "hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink";

export function SpeakControls({ text }: { text: string }) {
    const { supported, state, progress, start, pause, resume, stop } = useSpeech();

    if (!supported) return null;

    const active = state !== "idle";

    return (
        <div className="border-b border-line">
            <div className="flex items-center gap-2 px-4 py-2">
                {!active ? (
                    <button onClick={() => start(text)} className={buttonClass}>
                        <SpeakerIcon /> Listen
                    </button>
                ) : (
                    <>
                        {state === "playing" ? (
                            <button onClick={pause} className={buttonClass}>
                                <PauseIcon /> Pause
                            </button>
                        ) : (
                            <button onClick={resume} className={buttonClass}>
                                <PlayIcon /> Resume
                            </button>
                        )}
                        <button onClick={stop} className={buttonClass}>
                            <StopIcon /> Stop
                        </button>

                        <span
                            className="ml-auto flex items-center gap-1.5 text-xs text-muted"
                            aria-live="polite"
                        >
                            {state === "playing" && (
                                <span aria-hidden className="flex h-3 items-end gap-0.5">
                                    {[0, 1, 2].map((i) => (
                                        <span
                                            key={i}
                                            className="w-0.5 rounded-full bg-device motion-safe:animate-pulse"
                                            style={{
                                                height: `${6 + i * 3}px`,
                                                animationDelay: `${i * 150}ms`,
                                            }}
                                        />
                                    ))}
                                </span>
                            )}
                            {state === "playing" ? "Reading aloud" : "Paused"}
                        </span>
                    </>
                )}
            </div>

            {active && (
                <div className="h-0.5 bg-line">
                    <div
                        className="h-full bg-ink transition-[width]"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
}