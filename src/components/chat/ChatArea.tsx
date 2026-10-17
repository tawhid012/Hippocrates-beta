"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Sparkles, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getGreeting } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import { Message } from "./Message";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput, type AttachmentFile } from "./ChatInput";
import { useApp } from "@/hooks/useAppContext";
import { ConversationLoadingSkeleton } from "@/components/skeletons/ConversationLoadingSkeleton";
import { GenerateSummaryButton } from "@/components/clinical/GenerateSummaryButton";
import { ModelSelector } from "@/components/model-selector/ModelSelector";

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming?: boolean;
  statusText?: string;
  isCaseLoading?: boolean;
  assessmentStatus?: string;
  urgencyLevel?: string;
  onSend: (message: string, attachment?: AttachmentFile | AttachmentFile[]) => void;
  onRegenerate: (messageId: string) => void;
  onRetry?: () => void;
  onOpenSummary?: () => void;
}

function getAssessmentStatusConfig(status?: string, urgency?: string) {
  const normStatus = (status || "").toUpperCase();
  const normUrgency = (urgency || "").toUpperCase();

  if (normStatus === "URGENT_ACTION_REQUIRED" || normUrgency === "EMERGENCY") {
    return {
      title: "Urgent attention recommended",
      description: "Based on symptoms reported, prompt medical evaluation is recommended.",
      buttonLabel: "Generate Urgent Care Summary",
      badgeText: "Urgent Attention",
      badgeStyle: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      iconBg: "bg-red-600/10 text-red-600 dark:text-red-400 border-red-500/20",
      iconColor: "text-red-600 dark:text-red-400",
      glowColor: "bg-red-500/10",
      isUrgent: true,
      icon: AlertTriangle,
    };
  }

  if (normStatus === "SUFFICIENT_FOR_PROVISIONAL_ASSESSMENT") {
    return {
      title: "Assessment ready",
      description: "Aegis has enough information to provide a provisional assessment. You can also generate a Health Summary.",
      buttonLabel: "Generate Health Summary",
      badgeText: "Assessment Ready",
      badgeStyle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      iconBg: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      glowColor: "bg-emerald-500/10",
      isUrgent: false,
      icon: Sparkles,
    };
  }

  if (normStatus === "COMPLETE") {
    return {
      title: "Assessment complete",
      description: "Clinical assessment is complete. You can view or generate the final health summary.",
      buttonLabel: "Generate Health Summary",
      badgeText: "Complete",
      badgeStyle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      iconBg: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      glowColor: "bg-emerald-500/10",
      isUrgent: false,
      icon: CheckCircle2,
    };
  }

  // Default: INCOMPLETE
  return {
    title: "Assessment in progress",
    description: "Aegis is still gathering information. A provisional summary can be generated from the information available so far.",
    buttonLabel: "Generate Provisional Summary",
    badgeText: "In Progress",
    badgeStyle: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    iconBg: "bg-sky-600/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
    glowColor: "bg-sky-500/10",
    isUrgent: false,
    icon: Clock,
  };
}

export function ChatArea({
  messages,
  isLoading,
  isStreaming = false,
  statusText = "Thinking...",
  isCaseLoading = false,
  assessmentStatus = "INCOMPLETE",
  urgencyLevel = "ROUTINE",
  onSend,
  onRegenerate,
  onRetry,
  onOpenSummary,
}: ChatAreaProps) {
  const { persona } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const hasMessages = messages.length > 0;
  const greeting = getGreeting();
  const isPatient = persona === "patient";

  const checkIfNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceToBottom < 100;
  }, []);

  const handleScroll = useCallback(() => {
    const near = checkIfNearBottom();
    setIsNearBottom(near);
    if (near) {
      setShowJumpToBottom(false);
    }
  }, [checkIfNearBottom]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    setShowJumpToBottom(false);
  }, []);

  // Auto-scroll logic: only follow new tokens/messages if user is already at the bottom
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    if (isNearBottom) {
      // User is following the conversation - auto-scroll down smoothly
      scrollToBottom(isStreaming ? "auto" : "smooth");
    } else if (isLoading || isStreaming) {
      // User is reading up - show the discreet jump button
      setShowJumpToBottom(true);
    }
  }, [messages, isLoading, isStreaming, isNearBottom, scrollToBottom]);

  if (isCaseLoading) {
    return (
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <ConversationLoadingSkeleton />
        </div>
        <ChatInput onSend={onSend} disabled={true} />
      </div>
    );
  }

  // Show typing indicator only when loading and no assistant message placeholder exists yet
  const lastMsg = messages[messages.length - 1];
  const showTypingIndicator = isLoading && (!lastMsg || lastMsg.role === "user");

  const suggestionChips = isPatient
    ? [
        { label: "Check symptoms", icon: Sparkles, prompt: "I would like to check some symptoms I've been having." },
        { label: "Explain blood report", icon: Sparkles, prompt: "Can you help explain the key test values in my medical blood report?" },
        { label: "Medication safety", icon: Sparkles, prompt: "Can you explain how this medication works and any common precautions?" },
        { label: "Physical rash or swelling", icon: Sparkles, prompt: "I have a visible skin rash/swelling and want to understand possible causes." },
      ]
    : [
        { label: "Differential Diagnosis", icon: Sparkles, prompt: "Help me analyze differential diagnoses for a patient presenting with: " },
        { label: "Consultation Listening", icon: Sparkles, prompt: "Ready to capture and synthesize ambient clinical consultation dialogue." },
        { label: "Clinical Summary & SOAP", icon: Sparkles, prompt: "Draft a clinical summary and SOAP note based on recent diagnostic findings." },
        { label: "Drug Interactions", icon: Sparkles, prompt: "Check drug-drug interactions and dosing guidelines for: " },
      ];

  const handleChipClick = (prompt: string) => {
    onSend(prompt);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 relative">
      {/* Floating Model Selector before starting a chat — disappears once chat starts */}
      <AnimatePresence>
        {!hasMessages && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="absolute top-2.5 inset-x-0 z-30 flex justify-center pointer-events-none px-4"
          >
            <div className="pointer-events-auto shadow-md rounded-full">
              <ModelSelector />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth flex flex-col"
      >
        {!hasMessages ? (
          <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-6 pt-14 max-w-2xl mx-auto w-full text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
              className="space-y-3 mb-8 w-full"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold tracking-wide border border-blue-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isPatient ? "Aegis Health Intelligence" : "Oracle Clinical Copilot"}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {isPatient ? `${greeting}.` : `${greeting}, Doctor.`}
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                {isPatient
                  ? "Ask health questions, describe symptoms, or attach photos and lab reports for clinical insights."
                  : "Clinical decision support, diagnostic assistance, and ambient consultation capture."}
              </p>
            </motion.div>

            {/* Native Android Suggestion Chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-left"
            >
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(chip.prompt)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-card hover:bg-muted/70 text-card-foreground border border-border/80 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer group text-left"
                >
                  <div className="h-7 w-7 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <chip.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium text-foreground/90 group-hover:text-foreground line-clamp-1">
                    {chip.label}
                  </span>
                </button>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4 sm:py-6 space-y-1 px-2 sm:px-4 w-full">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                onRegenerate={onRegenerate}
                onRetry={onRetry}
              />
            ))}
          </AnimatePresence>

          {showTypingIndicator && <TypingIndicator statusText={statusText} />}

          {/* Aegis Clinical Status & Summary Action Card — only shown when diagnosis progress is complete or ready */}
          {isPatient &&
            messages.length >= 2 &&
            !isLoading &&
            !isStreaming &&
            onOpenSummary &&
            assessmentStatus !== "INCOMPLETE" &&
            (() => {
              const config = getAssessmentStatusConfig(assessmentStatus, urgencyLevel);
            const IconComponent = config.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`my-6 p-5 rounded-2xl border ${
                  config.isUrgent
                    ? "border-red-500/30 bg-red-500/10 text-card-foreground"
                    : "border-border bg-card text-card-foreground shadow-xs"
                } flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden`}
              >
                {/* Soft subtle backing glow inside the card */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${config.glowColor} blur-2xl pointer-events-none`} />
                
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${config.iconBg} shrink-0`}>
                    <IconComponent className={`h-5 w-5 ${config.isUrgent ? "animate-bounce" : ""}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground tracking-tight">
                        {config.title}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.badgeStyle}`}>
                        {config.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-md">
                      {config.description}
                    </p>
                  </div>
                </div>

                <GenerateSummaryButton
                  variant="default"
                  label={config.buttonLabel}
                  onClick={onOpenSummary}
                  className={`shrink-0 text-xs py-2.5 px-4 rounded-xl ${
                    config.isUrgent
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  } text-white font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] relative z-10 shadow-sm`}
                />
              </motion.div>
            );
          })()}

          <div ref={bottomRef} className="h-4" />
        </div>
        )}
      </div>

      {/* Discreet floating "↓ New response" button if user scrolled up while reading */}
      <AnimatePresence>
        {showJumpToBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20"
          >
            <button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-medium shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-md border border-white/10 transition-all hover:scale-105 active:scale-95"
            >
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
              <span>New response</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-blocking composer: users can type and submit follow-up questions anytime */}
      <ChatInput onSend={onSend} />
    </div>
  );
}

