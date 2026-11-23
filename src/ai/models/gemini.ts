
import {
    getAI,
    getGenerativeModel,
    GoogleAIBackend,
} from "firebase/ai";

import { firebaseApp } from "../../core/firebase/firebase";

// Connect Firebase AI Logic to the Gemini Developer API.
const ai = getAI(firebaseApp, {
    backend: new GoogleAIBackend(),
});

// Create a Gemini model instance.
const model = getGenerativeModel(ai, {
    model: "gemini-3.5-flash-lite",
});

// Send a prompt and return Gemini's response.
export async function askGemini(prompt: string): Promise<string> {
    const result = await model.generateContent(prompt);

    return result.response.text();
}
