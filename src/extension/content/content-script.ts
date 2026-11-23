import { extractPage } from "./extract-page";
import type { ExtensionMessage, PageContextResponse } from "../messaging/types";

chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse: (r: PageContextResponse) => void) => {
        if (message.type === "GET_PAGE_CONTEXT") {
            try {
                sendResponse({ ok: true, context: extractPage() });
            } catch (e) {
                sendResponse({ ok: false, error: e instanceof Error ? e.message : "Extraction failed" });
            }
        }
        return false; // we respond synchronously
    }
);
