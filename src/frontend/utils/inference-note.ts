import type { AIResponse } from "../../core/types/ai";

export type InferenceKind = "device" | "cloud" | "fallback";

export interface InferenceNote {
    kind: InferenceKind;
    title: string;
    detail: string;
}

/** Describes where a response was actually processed, using only what the response reports. */
export function describeInference(inf: AIResponse["inference"]): InferenceNote {
    if (inf.source === "on-device") {
        return {
            kind: "device",
            title: "Answered on your device",
            detail: "The page text stayed on this device.",
        };
    }

    if (inf.fallbackUsed) {
        return {
            kind: "fallback",
            title: "Answered in the cloud",
            detail:
                "PagePilot tried your device first, but it couldn't run this request, so it used the cloud.",
        };
    }

    if (inf.requestedMode === "cloud") {
        return {
            kind: "cloud",
            title: "Answered in the cloud",
            detail: "You chose cloud processing, so the page text was sent to the cloud model.",
        };
    }

    // Auto mode routed straight to the cloud (request too large or page incomplete).
    return {
        kind: "cloud",
        title: "Answered in the cloud",
        detail:
            "This request needed more of the page than your device can process, so PagePilot sent it to the cloud model.",
    };
}