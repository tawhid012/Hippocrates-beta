import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";

// If a live backend server URL is configured (e.g., https://your-production-app.vercel.app),
// Capacitor can connect its secure native shell directly to the hosted Next.js backend,
// while preserving all native device features, audio recording, and hardware back button.
// Production hosted backend for Android APK (accessible globally over Wi-Fi & cellular 4G/5G)
const DEFAULT_SERVER_URL =
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://hippocrates-beta.vercel.app";
const serverUrl = DEFAULT_SERVER_URL;

const isHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "ai.hippocrates.app",
  appName: "HIPPOCRATES",
  webDir: "public",
  server: {
    url: serverUrl,
    cleartext: isHttp,
    androidScheme: "https",
    allowNavigation: [
      "hippocrates-beta.vercel.app",
      "hippocrates-mobile.vercel.app",
      "*.vercel.app",
      "*.supabase.co",
      "accounts.google.com",
      "*.google.com"
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#090d16",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_INSIDE",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#090d16",
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Light,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
