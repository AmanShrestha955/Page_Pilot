
import { getApp, getApps, initializeApp } from "firebase/app";
import {
    CustomProvider,
    initializeAppCheck,
} from "firebase/app-check";

console.log("[PagePilot] Firebase module loaded");

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

if (!import.meta.env.DEV) {
    throw new Error(
        "Production App Check provider has not been configured."
    );
}

// Enable Firebase's debug-token flow before initializing App Check.
(
    self as typeof self & {
        FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
    }
).FIREBASE_APPCHECK_DEBUG_TOKEN = true;

export const appCheck = initializeAppCheck(firebaseApp, {
    provider: new CustomProvider({
        getToken: async () => {
            throw new Error(
                "The development debug-token flow should handle App Check requests."
            );
        },
    }),
    isTokenAutoRefreshEnabled: true,
});

console.log("[PagePilot] App Check initialized");
