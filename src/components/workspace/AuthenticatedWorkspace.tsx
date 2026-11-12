"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useApp } from "@/hooks/useAppContext";
import { useChat } from "@/hooks/useChat";
import { api } from "@/lib/api-client";
import type { CaseSummary } from "@/lib/types";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatArea } from "@/components/chat/ChatArea";
import { ModelSelector } from "@/components/model-selector/ModelSelector";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { AegisWorkspace } from "@/components/aegis/AegisWorkspace";
import { AegisProVoiceView } from "@/components/aegis/AegisProVoiceView";
import { deleteConsultationState } from "@/lib/consultation/consultationStorage";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { DoctorOnboardingModal } from "@/components/auth/DoctorOnboardingModal";
import { RoleRestrictedModal } from "@/components/auth/RoleRestrictedModal";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";

export function AuthenticatedWorkspace() {
  const { persona, selectPersona, selectedModel, settingsOpen, setSettingsOpen } = useApp();
  const {
    user,
    isDoctorVerified,
    isPatientAccount,
    setRoleRestrictedModalOpen,
    setDoctorOnboardingOpen,
  } = useAuth();
  // Optimistic cases state hydrated from localStorage cache immediately
  const [cases, setCases] = useState<CaseSummary[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const workspace = persona === "patient" ? "aegis" : "oracle";
      const lastUser = localStorage.getItem("hippocrates_last_user_id");
      if (lastUser) {
        const cached = localStorage.getItem(`hippocrates_cached_cases_${lastUser}_${workspace}`);
        if (cached) return JSON.parse(cached) as CaseSummary[];
      }
    } catch {}
    return [];
  });
  const [casesLoading, setCasesLoading] = useState(cases.length === 0);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  // Tombstones to prevent in-flight queries from resurrecting deleted cases
  const deletedCaseIdsRef = useRef<Set<string>>(new Set());

  // Version counter to preserve the latest edit when multiple mutations occur quickly
  const renameVersionRef = useRef<Map<string, number>>(new Map());

  const loadCases = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) {
        setCasesLoading(false);
        return;
      }

      const isSilent = options?.silent ?? cases.length > 0;
      if (!isSilent) {
        setCasesLoading(true);
      }

      const workspace = persona === "patient" ? "aegis" : "oracle";
      const cacheKey = `hippocrates_cached_cases_${user.id}_${workspace}`;

      try {
        const fetched = await api.listCases(workspace);
        // Exclude any tombstoned cases that might still be returned during database propagation
        const activeFetched = fetched.filter((c) => !deletedCaseIdsRef.current.has(c.id));
        setCases(activeFetched);

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(activeFetched));
            localStorage.setItem("hippocrates_last_user_id", user.id);
          } catch {
            // ignore storage quota
          }
        }
      } catch (err) {
        console.warn("[AuthenticatedWorkspace] Failed to fetch cases from network, falling back to cache:", err);
        if (typeof window !== "undefined") {
          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached) as CaseSummary[];
              setCases(parsed.filter((c) => !deletedCaseIdsRef.current.has(c.id)));
            } else {
              setCases([]);
            }
          } catch {
            setCases([]);
          }
        } else {
          setCases([]);
        }
      } finally {
        setCasesLoading(false);
      }
    },
    [persona, user, cases.length]
  );

  const {
    activeCaseId,
    messages,
    isLoading,
    isStreaming,
    statusText,
    isCaseLoading,
    safetyEvaluation,
    assessmentStatus,
    urgencyLevel,
    sendMessage,
    regenerate,
    retryLastMessage,
    startNewConsultation,
    loadCase,
  } = useChat(selectedModel, {
    onCasesChanged: () => void loadCases({ silent: true }),
    persona: persona || "doctor",
  });

  useEffect(() => {
    if (persona && user) {
      void loadCases({ silent: cases.length > 0 });
    } else if (!user) {
      setCases([]);
      setCasesLoading(false);
    }
  }, [persona, user, loadCases, cases.length]);

  // Strict user isolation: reset active consultation when user identity changes
  useEffect(() => {
    startNewConsultation();
  }, [user?.id, startNewConsultation]);

  const handleNewCase = () => {
    startNewConsultation();
  };

  const handleSelectCase = async (caseId: string) => {
    await loadCase(caseId);
  };

  /**
   * Optimistic deletion:
   * - Immediately removes case from visible list and local cache
   * - Tombstones caseId to prevent resurrection from in-flight requests
   * - Switches consultation if currently active
   * - Persists mutation asynchronously in background
   * - Restores previous state on mutation failure with concise feedback
   */
  const handleDeleteCase = useCallback(
    async (caseId: string) => {
      const targetCase = cases.find((c) => c.id === caseId);
      if (!targetCase) return;

      const previousCases = [...cases];

      // 1. Tombstone guard
      deletedCaseIdsRef.current.add(caseId);

      // 2. Optimistic local state removal
      const updatedCases = cases.filter((c) => c.id !== caseId);
      setCases(updatedCases);

      // 3. Update localStorage cache immediately
      if (user && typeof window !== "undefined") {
        const workspace = persona === "patient" ? "aegis" : "oracle";
        const cacheKey = `hippocrates_cached_cases_${user.id}_${workspace}`;
        try {
          localStorage.setItem(cacheKey, JSON.stringify(updatedCases));
        } catch {}
      }

      // 4. Switch consultation if active
      if (caseId === activeCaseId) {
        startNewConsultation();
      }
      deleteConsultationState(caseId);

      // 5. Asynchronous background mutation
      try {
        await api.deleteCase(caseId);
      } catch (err) {
        console.error("[AuthenticatedWorkspace] Background delete failed:", err);
        // Rollback state and release tombstone
        deletedCaseIdsRef.current.delete(caseId);
        setCases(previousCases);
        if (user && typeof window !== "undefined") {
          const workspace = persona === "patient" ? "aegis" : "oracle";
          const cacheKey = `hippocrates_cached_cases_${user.id}_${workspace}`;
          try {
            localStorage.setItem(cacheKey, JSON.stringify(previousCases));
          } catch {}
        }
        setSyncErrorMessage("Unable to delete conversation. Please check your connection.");
        setTimeout(() => setSyncErrorMessage(null), 4000);
      }
    },
    [cases, user, persona, activeCaseId, startNewConsultation]
  );

  /**
   * Optimistic editing:
   * - Updates title immediately in visible state and local cache
   * - Increments monotonic sequence counter to preserve latest edit
   * - Persists mutation asynchronously in background without full-page reloads
   * - Restores previous title on mutation failure with concise feedback
   */
  const handleRenameCase = useCallback(
    async (caseId: string, newTitle: string) => {
      const trimmed = newTitle.trim();
      if (!trimmed) return;

      const targetCase = cases.find((c) => c.id === caseId);
      if (!targetCase || targetCase.title === trimmed) return;

      const previousCases = [...cases];

      // 1. Monotonic version bump for concurrency guard
      const nextVersion = (renameVersionRef.current.get(caseId) || 0) + 1;
      renameVersionRef.current.set(caseId, nextVersion);

      // 2. Optimistic local state update
      const updatedCases = cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              title: trimmed,
              updatedAt: new Date().toISOString(),
              metadata: {
                ...(c.metadata || {}),
                is_custom_title: true,
                title_user_edited: true,
              },
            }
          : c
      );
      setCases(updatedCases);

      // 3. Update localStorage cache immediately
      if (user && typeof window !== "undefined") {
        const workspace = persona === "patient" ? "aegis" : "oracle";
        const cacheKey = `hippocrates_cached_cases_${user.id}_${workspace}`;
        try {
          localStorage.setItem(cacheKey, JSON.stringify(updatedCases));
        } catch {}
      }

      // 4. Asynchronous background mutation
      try {
        await api.renameCase(caseId, trimmed);
        // If a newer edit for this case was initiated while in flight, discard
        if (renameVersionRef.current.get(caseId) !== nextVersion) {
          return;
        }
      } catch (err) {
        console.error("[AuthenticatedWorkspace] Background rename failed:", err);
        // Rollback only if this is still the active version
        if (renameVersionRef.current.get(caseId) === nextVersion) {
          setCases(previousCases);
          if (user && typeof window !== "undefined") {
            const workspace = persona === "patient" ? "aegis" : "oracle";
            const cacheKey = `hippocrates_cached_cases_${user.id}_${workspace}`;
            try {
              localStorage.setItem(cacheKey, JSON.stringify(previousCases));
            } catch {}
          }
          setSyncErrorMessage("Unable to save conversation title. Please check your connection.");
          setTimeout(() => setSyncErrorMessage(null), 4000);
        }
      }
    },
    [cases, user, persona]
  );

  const handleRegenerate = useCallback(() => {
    if (messages.length > 0) {
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
      if (lastAssistant) {
        void regenerate(lastAssistant.id);
      }
    }
  }, [messages, regenerate]);

  // Enforce role bounds for authenticated users
  useEffect(() => {
    if (user) {
      if (isPatientAccount && persona !== "patient") {
        selectPersona("patient");
      } else if (user.user_metadata?.role === "doctor" && persona !== "doctor") {
        selectPersona("doctor");
      }
    }
  }, [user, isPatientAccount, persona, selectPersona]);

  useEffect(() => {
    if (!user) return;

    if (persona === "doctor") {
      if (isPatientAccount) {
        selectPersona("patient");
        setRoleRestrictedModalOpen(true);
      } else if (!isDoctorVerified) {
        setDoctorOnboardingOpen(true);
      }
    }
  }, [persona, user, isPatientAccount, isDoctorVerified, selectPersona, setRoleRestrictedModalOpen, setDoctorOnboardingOpen]);

  // Once logged in, persona is 100% deterministic
  if (!persona) {
    if (isPatientAccount) {
      selectPersona("patient");
      return null;
    }
    if (user?.user_metadata?.role === "doctor") {
      selectPersona("doctor");
      return null;
    }
    selectPersona("patient");
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <Header />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar
            onNewCase={handleNewCase}
            onSelectCase={handleSelectCase}
            onDeleteCase={handleDeleteCase}
            onRenameCase={handleRenameCase}
            onOpenSettings={() => setSettingsOpen(true)}
            cases={cases}
            casesLoading={casesLoading}
            activeCaseId={activeCaseId}
          />

          <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
            {syncErrorMessage && (
              <div className="shrink-0 px-4 py-1.5 mx-auto max-w-md w-full">
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs shadow-sm animate-in fade-in duration-200">
                  <span>{syncErrorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setSyncErrorMessage(null)}
                    className="text-amber-700 hover:text-amber-900 dark:text-amber-300 p-0.5"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="flex shrink-0 justify-center px-4 pb-1 pt-3">
              <ModelSelector />
            </div>

            {persona === "doctor" ? (
              !isDoctorVerified ? (
                <div className="flex flex-1 items-center justify-center p-4 sm:p-6 text-center">
                  <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white border border-emerald-200/80 shadow-xl space-y-4">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                      <Stethoscope className="h-7 w-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Doctor Verification Required</h2>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Under clinical safety protocols, access to the Oracle Clinical Copilot requires your official Medical Council Registration Number.
                      </p>
                    </div>
                    <Button
                      onClick={() => setDoctorOnboardingOpen(true)}
                      className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                    >
                      Provide Doctor Registration Number
                    </Button>
                  </div>
                </div>
              ) : (
                <ChatArea
                  messages={messages}
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                  statusText={statusText}
                  isCaseLoading={isCaseLoading}
                  assessmentStatus={assessmentStatus}
                  urgencyLevel={urgencyLevel}
                  onSend={sendMessage}
                  onRegenerate={handleRegenerate}
                  onRetry={retryLastMessage}
                />
              )
            ) : selectedModel === "aegis-pro" ? (
              <AegisProVoiceView />
            ) : (
              <AegisWorkspace
                messages={messages}
                isLoading={isLoading}
                isStreaming={isStreaming}
                statusText={statusText}
                isCaseLoading={isCaseLoading}
                onSend={sendMessage}
                onRegenerate={handleRegenerate}
                onRetry={retryLastMessage}
                safetyEvaluation={safetyEvaluation}
                assessmentStatus={assessmentStatus}
                urgencyLevel={urgencyLevel}
                activeCaseId={activeCaseId}
              />
            )}
          </main>
        </div>

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
        <AuthModal />
        <DoctorOnboardingModal />
        <RoleRestrictedModal />
      </div>
    </TooltipProvider>
  );
}
