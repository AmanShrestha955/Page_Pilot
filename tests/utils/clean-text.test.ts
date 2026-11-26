import { describe, expect, it } from "vitest";
import { removeCitationMarkers } from "../../src/core/utils/clean-text";

describe("removeCitationMarkers", () => {
    it("removes a numeric citation after a sentence", () => {
        expect(removeCitationMarkers("lack scholarly consensus.[12]")).toBe(
            "lack scholarly consensus."
        );
    });

    it("removes chained markers", () => {
        expect(removeCitationMarkers("factual support.[13] [d]")).toBe(
            "factual support."
        );
        expect(removeCitationMarkers("the future.[19][e]")).toBe("the future.");
    });

    it("leaves code indexes alone", () => {
        expect(removeCitationMarkers("const x = arr[0];")).toBe("const x = arr[0];");
        expect(removeCitationMarkers("getItems()[0]")).toBe("getItems()[0]");
    });
});