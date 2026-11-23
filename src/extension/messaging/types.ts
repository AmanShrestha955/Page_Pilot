import type { PageContext } from "../../core/types/ai";

export type ExtensionMessage = { type: "GET_PAGE_CONTEXT" };

export type PageContextResponse =
    | { ok: true; context: PageContext }
    | { ok: false; error: string };
