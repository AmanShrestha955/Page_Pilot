import { describe, expect, it } from "vitest";
import { canSwitchToAuto, friendlyError } from "../../src/frontend/utils/friendly-error";
import { describeInference } from "../../src/frontend/utils/inference-note";
import { privacyNote } from "../../src/frontend/utils/privacy-note";

describe("describeInference", () => {
    it("follows the actual source, not the requested mode", () => {
        expect(
            describeInference({ source: "on-device", requestedMode: "auto", fallbackUsed: false }).kind
        ).toBe("device");
    });

    it("reports a fallback only when the device was tried first", () => {
        expect(
            describeInference({ source: "cloud", requestedMode: "auto", fallbackUsed: true }).kind
        ).toBe("fallback");
    });

    it("does not call direct cloud routing a fallback", () => {
        const note = describeInference({ source: "cloud", requestedMode: "auto", fallbackUsed: false });
        expect(note.kind).toBe("cloud");
        expect(note.detail).toMatch(/needed more of the page/);
    });

    it("says when the user chose the cloud", () => {
        const note = describeInference({ source: "cloud", requestedMode: "cloud", fallbackUsed: false });
        expect(note.detail).toMatch(/You chose cloud/);
    });
});

describe("privacyNote", () => {
    it("promises no cloud use in on-device mode", () => {
        expect(privacyNote("on-device")).toMatch(/stays here/);
        expect(privacyNote("on-device")).toMatch(/instead of using the cloud/);
    });

    it("says cloud mode sends the text", () => {
        expect(privacyNote("cloud")).toMatch(/sent to a cloud/);
    });

    it("explains that auto can use either", () => {
        expect(privacyNote("auto")).toMatch(/your device/);
        expect(privacyNote("auto")).toMatch(/cloud/);
    });
});

describe("strict on-device errors", () => {
    it.each(["CONTEXT_TOO_LARGE", "INCOMPLETE_CONTEXT", "MODEL_UNAVAILABLE"])(
        "offers Auto for %s in on-device mode only",
        (code) => {
            expect(canSwitchToAuto({ code }, "on-device")).toBe(true);
            expect(canSwitchToAuto({ code }, "cloud")).toBe(false);
            expect(canSwitchToAuto({ code }, "auto")).toBe(false);
        }
    );

    it("does not offer Auto for unrelated errors", () => {
        expect(canSwitchToAuto({ code: "RATE_LIMITED" }, "on-device")).toBe(false);
    });

    it("explains that the device cannot run the model", () => {
        expect(friendlyError({ code: "MODEL_UNAVAILABLE" }, "on-device")).toMatch(
            /isn't available in this browser/
        );
        expect(friendlyError({ code: "MODEL_UNAVAILABLE" }, "cloud")).toMatch(
            /Wait a moment/
        );
    });
});