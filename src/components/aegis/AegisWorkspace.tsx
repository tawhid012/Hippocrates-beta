"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { ChatArea } from "@/components/chat/ChatArea";
import type { ChatMessage, SafetyEvaluation } from "@/lib/types";
import type { AttachmentFile } from "@/components/chat/ChatInput";
import { DocumentGenerationModal } from "@/components/clinical/DocumentGenerationModal";

interface AegisWorkspaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming?: boolean;
  statusText?: string;
  isCaseLoading?: boolean;
  onSend: (message: string, attachment?: AttachmentFile | AttachmentFile[]) => void;
  onRegenerate: (messageId: string) => void;
  onRetry?: () => void;
  safetyEvaluation?: SafetyEvaluation | null;
  assessmentStatus?: string;
  urgencyLevel?: string;
  activeCaseId?: string | null;
}

export function AegisWorkspace({
  messages,
  isLoading,
  isStreaming = false,
  statusText,
  isCaseLoading = false,
  onSend,
  onRegenerate,
  onRetry,
  safetyEvaluation,
  assessmentStatus,
  urgencyLevel,
  activeCaseId,
}: AegisWorkspaceProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 relative">

      {/* Safety Banner if Emergency Detected in Chat or Report */}
      {safetyEvaluation?.level === "POTENTIAL_EMERGENCY" && (
        <div className="bg-red-600 text-white px-4 py-3 shadow-md flex items-center gap-3 text-xs sm:text-sm shrink-0">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">EMERGENCY ALERT: </span>
            <span>{safetyEvaluation.emergencyWarning || "Seek immediate emergency medical attention. Call 112 (India) or your local emergency number, or go to the nearest Emergency Department immediately."}</span>
          </div>
        </div>
      )}

      {/* Main Unified Workspace */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          statusText={statusText}
          isCaseLoading={isCaseLoading}
          assessmentStatus={assessmentStatus}
          urgencyLevel={urgencyLevel}
          onSend={onSend}
          onRegenerate={onRegenerate}
          onRetry={onRetry}
          onOpenSummary={() => setIsModalOpen(true)}
        />
      </div>

      {/* Clinical Document Generation Modal */}
      <DocumentGenerationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        conversationId={activeCaseId || ""}
        model="Aegis Core"
        messages={messages}
      />
    </div>
  );
}

