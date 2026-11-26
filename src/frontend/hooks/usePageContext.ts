import { useCallback, useRef, useState } from "react";
import type { PageContext } from "../../core/types/ai";
import type { PageContextResponse } from "../../extension/messaging/types";

export function usePageContext() {
    const [context, setContext] = useState<PageContext | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const latest = useRef(0);

    const refresh = useCallback(async (): Promise<PageContext | null> => {
        const id = ++latest.current;
        setLoading(true);
        setError(null);

        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            if (!tab?.id) {
                throw new Error("No active tab found.");
            }

            const res: PageContextResponse = await chrome.tabs.sendMessage(
                tab.id,
                { type: "GET_PAGE_CONTEXT" }
            );

            if ("context" in res) {
                // for testing only

                // const c = res.context;
                // console.log("[PagePilot] summary", {
                //     title: c.title,
                //     headings: c.headings,
                //     characters: c.content.length,
                //     truncated: c.truncated,
                //     selectionLength: c.selectedText?.length ?? 0,
                // });
                // console.log("[PagePilot] first 1500 characters:\n" + c.content.slice(0, 1500));
                // console.log("[PagePilot] last 300 characters:\n" + c.content.slice(-300));
                // if (c.selectedText) {
                //     console.log("[PagePilot] selection end:\n" + c.selectedText.slice(-200));
                // }
                if (id === latest.current) setContext(res.context);
                return res.context;
            }

            throw new Error(res.error);
        } catch (e) {
            console.error("PagePilot extraction failed:", e);

            if (id === latest.current) {
                setContext(null);
                setError(
                    "PagePilot can't read this page. It may be a browser page, or you may need to refresh the tab."
                );
            }

            return null;
        } finally {
            if (id === latest.current) setLoading(false);
        }
    }, []);

    return { context, error, loading, refresh };
}