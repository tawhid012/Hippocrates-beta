"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { useApp } from "@/hooks/useAppContext";

interface UseMobileAppOptions {
  onBackPress?: () => boolean; // return true if handled
}

export function useMobileApp(options?: UseMobileAppOptions) {
  const { sidebarOpen, setSidebarOpen, settingsOpen, setSettingsOpen, selectedModel, setSelectedModel } = useApp();

  const stateRef = useRef({
    options,
    sidebarOpen,
    setSidebarOpen,
    settingsOpen,
    setSettingsOpen,
    selectedModel,
    setSelectedModel,
  });

  useEffect(() => {
    stateRef.current = {
      options,
      sidebarOpen,
      setSidebarOpen,
      settingsOpen,
      setSettingsOpen,
      selectedModel,
      setSelectedModel,
    };
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 1. Configure Native Status Bar
    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#fcfdfe" });
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      } catch {
        // Safe fallback
      }
    };
    void setupStatusBar();

    // 2. Hide Native Splash Screen smoothly once UI is loaded
    const hideSplash = async () => {
      try {
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch {
        // Safe fallback
      }
    };
    const timer = setTimeout(() => {
      void hideSplash();
    }, 400);

    // 3. Native Hardware Back Button Handler for Android
    let backListener: { remove: () => Promise<void> } | null = null;
    const setupBackButton = async () => {
      try {
        backListener = await App.addListener("backButton", ({ canGoBack }) => {
          const state = stateRef.current;
          // Priority 1: Custom external handler
          if (state.options?.onBackPress && state.options.onBackPress()) {
            return;
          }

          // Priority 2: Close settings modal if open
          if (state.settingsOpen) {
            state.setSettingsOpen(false);
            return;
          }

          // Priority 3: Close sidebar if open
          if (state.sidebarOpen) {
            state.setSidebarOpen(false);
            return;
          }

          // Priority 4: Return from Aegis Pro voice to Aegis Core chat
          if (state.selectedModel === "aegis-pro") {
            state.setSelectedModel("aegis-core");
            return;
          }

          // Priority 5: Native back or minimize
          if (canGoBack) {
            window.history.back();
          } else {
            void App.minimizeApp();
          }
        });
      } catch {
        // Safe fallback
      }
    };
    void setupBackButton();

    // 4. Handle Deep Link OAuth Callbacks (ai.hippocrates.app://auth/callback)
    let urlListener: { remove: () => Promise<void> } | null = null;
    const setupUrlListener = async () => {
      try {
        urlListener = await App.addListener("appUrlOpen", (data) => {
          if (data.url && (data.url.includes("auth/callback") || data.url.includes("access_token") || data.url.includes("code="))) {
            const urlObj = new URL(data.url);
            const search = urlObj.search;
            const hash = urlObj.hash;
            if (window.location) {
              window.location.href = `/auth/callback${search}${hash}`;
            }
          }
        });
      } catch {
        // Safe fallback
      }
    };
    void setupUrlListener();

    return () => {
      clearTimeout(timer);
      if (backListener) {
        void backListener.remove();
      }
      if (urlListener) {
        void urlListener.remove();
      }
    };
  }, []);
}
