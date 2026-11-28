import { useEffect, useRef, useState } from "react";
import { splitIntoChunks, toSpeakable } from "../utils/speech-text";

export type SpeechState = "idle" | "playing" | "paused";

export function useSpeech() {
    const supported =
        typeof window !== "undefined" && "speechSynthesis" in window;

    const [state, setState] = useState<SpeechState>("idle");
    const [progress, setProgress] = useState(0);

    const chunks = useRef<string[]>([]);
    const index = useRef(0);
    const runId = useRef(0); // lets callbacks from an old run ignore themselves
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null); // prevents garbage collection

    function reset() {
        setState("idle");
        setProgress(0);
    }

    function speakNext(id: number): void {
        const text = chunks.current[index.current];
        if (text === undefined) {
            reset();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";

        utterance.onend = () => {
            if (id !== runId.current) return;
            index.current += 1;
            setProgress(index.current / chunks.current.length);
            speakNext(id);
        };

        utterance.onerror = (e) => {
            if (id !== runId.current) return;
            if (e.error === "interrupted" || e.error === "canceled") return;
            console.error("PagePilot speech failed:", e.error);
            reset();
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }

    function start(markdown: string) {
        if (!supported) return;

        const synth = window.speechSynthesis;
        runId.current += 1;
        synth.cancel();
        synth.resume(); // clears a stuck paused state

        chunks.current = splitIntoChunks(toSpeakable(markdown));
        index.current = 0;
        if (chunks.current.length === 0) return;

        setProgress(0);
        setState("playing");
        speakNext(runId.current);
    }

    function pause() {
        if (!supported) return;
        window.speechSynthesis.pause();
        setState("paused");
    }

    function resume() {
        if (!supported) return;
        window.speechSynthesis.resume();
        setState("playing");
    }

    function stop() {
        if (!supported) return;
        runId.current += 1;
        window.speechSynthesis.cancel();
        reset();
    }

    // Stop speaking when the component goes away.
    useEffect(() => {
        return () => {
            runId.current += 1;
            if (supported) window.speechSynthesis.cancel();
        };
    }, [supported]);

    return { supported, state, progress, start, pause, resume, stop };
}