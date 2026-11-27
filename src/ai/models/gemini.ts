
import {
    getAI,
    getGenerativeModel,
    GoogleAIBackend,
    InferenceMode as FirebaseInferenceMode,
    InferenceSource as FirebaseInferenceSource,
} from "firebase/ai";

import { firebaseApp } from "../../core/firebase/firebase";

import type {
    InferenceMode,
    InferenceSource,
} from "../../core/types/ai";

const CLOUD_MODEL = "gemini-3.5-flash-lite";

// Connect Firebase AI Logic to the Gemini Developer API.
const ai = getAI(firebaseApp, {
    backend: new GoogleAIBackend(),
});

// Existing cloud-only model. Preserved for backward compatibility.
const cloudModel = getGenerativeModel(ai, {
    model: CLOUD_MODEL,
});

// Cache hybrid model instances by application inference mode.
const hybridModels = new Map<
    InferenceMode,
    ReturnType<typeof getGenerativeModel>
>();

function getHybridModel(mode: InferenceMode) {
    const cachedModel = hybridModels.get(mode);

    if (cachedModel) {
        return cachedModel;
    }

    const firebaseMode = {
        auto: FirebaseInferenceMode.PREFER_ON_DEVICE,
        "on-device": FirebaseInferenceMode.ONLY_ON_DEVICE,
        cloud: FirebaseInferenceMode.ONLY_IN_CLOUD,
    }[mode];

    const model = getGenerativeModel(ai, {
        mode: firebaseMode,
        inCloudParams: {
            model: CLOUD_MODEL,
        },
        onDeviceParams: {
            createOptions: {
                expectedInputs: [
                    { type: "text", languages: ["en"] },
                ],
                expectedOutputs: [
                    { type: "text", languages: ["en"] },
                ],
            },
        },
    });

    hybridModels.set(mode, model);

    return model;
}

function mapInferenceSource(
    source: string | undefined
): InferenceSource {
    if (source === FirebaseInferenceSource.ON_DEVICE) {
        return "on-device";
    }

    if (source === FirebaseInferenceSource.IN_CLOUD) {
        return "cloud";
    }

    throw new Error(
        "Firebase did not report the actual inference source."
    );
}

export interface HybridGeminiResult {
    text: string;
    source: InferenceSource;
}

/**
 * Prepare Gemini Nano for on-device inference.
 *
 * Call this after a user interaction, such as clicking
 * an initialization or AI action button.
 */
export async function initializeDeviceModel(
    onDownloadProgress?: (progress: number) => void,
    mode: "auto" | "on-device" = "auto"
): Promise<void> {
    const model = getHybridModel(mode);

    await model.initializeDeviceModel(onDownloadProgress);
}

/**
 * Generate a response using Firebase Hybrid AI Logic.
 */
export async function generateHybridGemini(
    prompt: string,
    mode: InferenceMode = "auto"
): Promise<HybridGeminiResult> {
    const model = getHybridModel(mode);

    const result = await model.generateContent(prompt);

    const text = result.response.text();
    const source = mapInferenceSource(
        result.response.inferenceSource
    );

    return {
        text,
        source,
    };
}

/**
 * Legacy cloud-only generation.
 * Kept temporarily so the existing service and tests
 * continue to work during the migration.
 */
export async function askGemini(
    prompt: string
): Promise<string> {
    const result = await cloudModel.generateContent(prompt);

    return result.response.text();
}
