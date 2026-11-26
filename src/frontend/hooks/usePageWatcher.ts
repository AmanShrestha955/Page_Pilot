import { useEffect, useRef } from "react";

/**
 * Reads the page when the panel opens, then again whenever the user
 * switches tabs or the active tab finishes loading.
 */
export function usePageWatcher(refresh: () => Promise<unknown>) {
    const refreshRef = useRef(refresh);

    useEffect(() => {
        refreshRef.current = refresh;
    }, [refresh]);

    useEffect(() => {
        let timer: number | undefined;

        // Wait briefly so the page and its content script have settled,
        // and so bursts of events cause a single read.
        const schedule = (delay = 350) => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => void refreshRef.current(), delay);
        };

        const onActivated = () => schedule();

        const onUpdated = (
            _tabId: number,
            info: { status?: string },
            tab: { active?: boolean }
        ) => {
            if (tab.active && info.status === "complete") schedule();
        };

        chrome.tabs.onActivated.addListener(onActivated);
        chrome.tabs.onUpdated.addListener(onUpdated);

        schedule(0); // initial read when the panel opens

        return () => {
            window.clearTimeout(timer);
            chrome.tabs.onActivated.removeListener(onActivated);
            chrome.tabs.onUpdated.removeListener(onUpdated);
        };
    }, []);
}
