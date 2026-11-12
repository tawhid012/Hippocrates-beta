"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Hippocrates Global Root Error Boundary]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen w-full flex items-center justify-center bg-[#fcfdfe] text-slate-900 px-4 py-12 font-sans antialiased">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-[0_20px_50px_rgba(26,39,68,0.08)] text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Hippocrates Connection Interrupted
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              A network disruption or server synchronization delay occurred. Click reload to resume your clinical session.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button
              onClick={() => reset()}
              className="h-10 rounded-xl px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recover Session</span>
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
              <span>Reload</span>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
