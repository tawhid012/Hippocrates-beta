"use client";

import React, { Component, type ReactNode } from "react";
import { AlertCircle, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WorkspaceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[WorkspaceErrorBoundary] Caught client error:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isNetwork =
        this.state.error?.message?.includes("fetch") ||
        this.state.error?.message?.includes("Network") ||
        this.state.error?.name === "ChunkLoadError" ||
        (typeof navigator !== "undefined" && !navigator.onLine);

      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50/50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md text-center space-y-5">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {isNetwork ? "Connection Temporarily Lost" : "Workspace Temporarily Unavailable"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isNetwork
                  ? "A network hiccup interrupted your live consultation. Your conversation data is safe."
                  : "A temporary component exception occurred while rendering the workspace."}
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={this.handleReset}
                className="h-9 rounded-xl px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== "undefined") window.location.reload();
                }}
                className="h-9 rounded-xl px-4 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

