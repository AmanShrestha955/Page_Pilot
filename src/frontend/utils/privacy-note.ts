import type { InferenceMode } from "../../core/types/ai";

export function privacyNote(mode: InferenceMode): string {
    switch (mode) {
        case "on-device":
            return "Runs on your device only. The page text stays here. If a request is too large, PagePilot stops instead of using the cloud.";
        case "cloud":
            return "The page text is sent to a cloud AI model to write the response.";
        case "auto":
            return "Short requests run on your device when possible. Larger requests, or ones your device can't run, are sent to a cloud AI model.";
    }
}