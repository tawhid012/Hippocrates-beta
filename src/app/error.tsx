"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Hippocrates Application Error Boundary]:", error);
  }, [error]);

  const isNetworkError =
    error.message?.includes("fetch") ||
    error.message?.includes("Network") ||
    error.message?.includes("ChunkLoadError") ||
    error.name === "ChunkLoadError" ||
    (typeof navigator !== "undefined" && !navigator.onLine);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fcfdfe] px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-[0_20px_50px_rgba(26,39,68,0.08)] text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {isNetworkError
              ? "Network Connection Interrupted"
              : "Temporary Application Interruption"}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isNetworkError
              ? "A network glitch or temporary connection drop interrupted your session. Your consultation records are safely cached."
              : "A temporary exception occurred while loading Hippocrates. Click below to recover your session."}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button
            onClick={() => reset()}
            className="h-10 rounded-xl px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="h-10 rounded-xl px-4 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Page</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }}
            className="h-10 rounded-xl px-3 text-xs text-slate-500 hover:text-slate-800 gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

