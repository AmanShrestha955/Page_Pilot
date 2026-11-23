import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
    manifest_version: 3,
    name: "PagePilot",
    version: "0.1.0",
    description: "Understand the internet, not just read it.",
    icons: {
        "16": "group.png",
        "48": "group.png",
        "128": "group.png",
    },
    action: {
        default_title: "Open PagePilot",
        default_icon: "group.png",
    },
    side_panel: { default_path: "index.html" },
    background: { service_worker: "src/extension/background/service-worker.ts", type: "module" },
    permissions: ["sidePanel", "activeTab", "scripting", "storage"],
    content_scripts: [
        {
            matches: ["http://*/*", "https://*/*"],
            js: ["src/extension/content/content-script.ts"],
            run_at: "document_idle",
        },
    ],
});