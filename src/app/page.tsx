"use client";

import { useCallback, useEffect, useState } from "react";
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
import { LandingPage } from "@/components/landing/LandingPage";
import { AegisWorkspace } from "@/components/aegis/AegisWorkspace";
import { AegisProVoiceView } from "@/components/aegis/AegisProVoiceView";

import { deleteConsultationState } from "@/lib/consultation/consultationStorage";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { DoctorOnboardingModal } from "@/components/auth/DoctorOnboardingModal";
import { RoleRestrictedModal } from "@/components/auth/RoleRestrictedModal";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";

function HomeContent() {
  const { persona, selectPersona, selectedModel, settingsOpen, setSettingsOpen } = useApp();
  const {
    user,
    isDoctorVerified,
    isPatientAccount,
    setRoleRestrictedModalOpen,
    setDoctorOnboardingOpen,
    openAuthModal,
    isLoading: authLoading,
  } = useAuth();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);

  const loadCases = useCallback(async () => {
    if (!user) return;
    setCasesLoading(true);
    try {
      const workspace = persona === "patient" ? "aegis" : "oracle";
      setCases(await api.listCases(workspace));
    } catch {
      setCases([]);
    } finally {
      setCasesLoading(false);
    }
  }, [persona, user]);

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
    onCasesChanged: loadCases,
    persona: persona || "doctor",
  });

  useEffect(() => {
    if (persona && user) {
      void loadCases();
    } else if (!user) {
      setCases([]);
    }
  }, [persona, user, loadCases]);

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

  const handleDeleteCase = useCallback(
    async (caseId: string) => {
      try {
        deleteConsultationState(caseId);
        await api.deleteCase(caseId);
        if (caseId === activeCaseId) {
          startNewConsultation();
        }
        await loadCases();
      } catch {
        // Silently fail
      }
    },
    [activeCaseId, startNewConsultation, loadCases]
  );

  const handleRenameCase = useCallback(
    async (caseId: string, newTitle: string) => {
      await api.renameCase(caseId, newTitle);
      await loadCases();
    },
    [loadCases]
  );

  const handleRegenerate = useCallback(() => {
    if (messages.length > 0) {
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
      if (lastAssistant) {
        void regenerate(lastAssistant.id);
      }
    }
  }, [messages, regenerate]);

  // Enforce 100% complete separation:
  // Patient account is permanently locked to Aegis. Doctor account is permanently locked to Oracle.
  useEffect(() => {
    if (user) {
      if (isPatientAccount && persona !== "patient") {
        selectPersona("patient");
      } else if (user.user_metadata?.role === "doctor" && persona !== "doctor") {
        selectPersona("doctor");
      }
    }
  }, [user, isPatientAccount, persona, selectPersona]);

  // Enforce doctor registration verification and patient role bounds
  useEffect(() => {
    if (persona === "doctor") {
      if (!user) {
        openAuthModal("doctor", "signup");
      } else if (isPatientAccount) {
        // Strict clinical rule: Patient accounts CANNOT access Doctor Mode
        selectPersona("patient");
        setRoleRestrictedModalOpen(true);
      } else if (!isDoctorVerified) {
        setDoctorOnboardingOpen(true);
      }
    } else if (persona === "patient" && !user) {
      openAuthModal("patient", "signup");
    }
  }, [persona, user, isPatientAccount, isDoctorVerified, openAuthModal, selectPersona, setRoleRestrictedModalOpen, setDoctorOnboardingOpen]);

  // Loading state while auth session is initializing
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#fcfdfe]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 font-sans">
            Securing Hippocrates Workspace...
          </p>
        </div>
      </div>
    );
  }

  // STRICT RULE: No one can use the chat board without logging in!
  if (!user) {
    return (
      <>
        <LandingPage
          onSelectPersona={(p) => openAuthModal(p, "signup")}
          onLaunchAegisPro={() => openAuthModal("patient", "signup")}
        />
        <AuthModal />
        <DoctorOnboardingModal />
        <RoleRestrictedModal />
      </>
    );
  }

  // Once logged in, persona is 100% deterministic — never show selection menus
  if (!persona) {
    if (isPatientAccount) {
      selectPersona("patient");
      return null;
    }
    if (user.user_metadata?.role === "doctor") {
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

export default function HomePage() {
  return <HomeContent />;
}
