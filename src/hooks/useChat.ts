"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ChatMessage,
  AIModelId,
  UserPersona,
  SafetyEvaluation,
  ChatAttachmentPayload,
} from "@/lib/types";
import { api } from "@/lib/api-client";
import {
  saveConsultationState,
  loadConsultationState,
  setActiveConsultationId,
  clearActiveConsultationId,
  validateMessagesIsolation,
} from "@/lib/consultation/consultationStorage";
import {
  createCleanCaseState,
  extractInstantaneousCaseUpdates,
  determineAssessmentStatusFromResponse,
  type AegisCaseState,
} from "@/services/aegis/aegisCaseState";
import { generateUUID } from "@/lib/uuid";

export type ChatStatus = "idle" | "sending" | "thinking" | "streaming" | "completed" | "error";

interface UseChatOptions {
  onCasesChanged?: () => void;
  persona?: UserPersona;
}

interface QueuedMessage {
  id: string;
  consultationId?: string;
  content: string;
  attachment?: ChatAttachmentPayload | ChatAttachmentPayload[];
}

interface UseChatReturn {
  activeCaseId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  isCaseLoading: boolean;
  chatStatus: ChatStatus;
  statusText: string;
  queuedCount: number;
  safetyEvaluation: SafetyEvaluation | null;
  assessmentStatus: string;
  urgencyLevel: string;
  error: string | null;
  sendMessage: (
    content: string,
    attachment?: ChatAttachmentPayload | ChatAttachmentPayload[]
  ) => Promise<void>;
  regenerate: (messageId: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  clearMessages: () => void;
  startNewConsultation: () => void;
  loadCase: (caseId: string) => Promise<void>;
}

export function useChat(model: AIModelId, options: UseChatOptions = {}): UseChatReturn {
  const { onCasesChanged, persona } = options;
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<ChatStatus>("idle");
  const [isCaseLoading, setIsCaseLoading] = useState(false);
  const [safetyEvaluation, setSafetyEvaluation] = useState<SafetyEvaluation | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<string>("INCOMPLETE");
  const [urgencyLevel, setUrgencyLevel] = useState<string>("ROUTINE");
  const [error, setError] = useState<string | null>(null);

  // Message queue for allowing typing and sequential sending during active streaming
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const isProcessingRef = useRef(false);
  const activeCaseIdRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const [queuedCount, setQueuedCount] = useState(0);

  // Keep refs in sync
  useEffect(() => {
    activeCaseIdRef.current = activeCaseId;
  }, [activeCaseId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /**
   * Explicitly starts a new consultation with a guaranteed clean clinical state.
   */
  const startNewConsultation = useCallback(() => {
    clearActiveConsultationId();

    // Explicitly reset all React state variables
    setActiveCaseId(null);
    activeCaseIdRef.current = null;
    setMessages([]);
    setSafetyEvaluation(null);
    setAssessmentStatus("INCOMPLETE");
    setUrgencyLevel("ROUTINE");
    setError(null);
    setChatStatus("idle");
    messageQueueRef.current = [];
    setQueuedCount(0);
    isProcessingRef.current = false;
  }, []);

  // Guarantee clean consultation isolation on mount or persona change
  useEffect(() => {
    startNewConsultation();
  }, [persona, startNewConsultation]);

  const isLoading = chatStatus === "sending" || chatStatus === "thinking" || chatStatus === "streaming";
  const isStreaming = chatStatus === "streaming";

  // Derive human-friendly status description for Aegis
  const getStatusText = useCallback(() => {
    if (chatStatus === "sending" || chatStatus === "thinking") {
      const lastMsg = messages[messages.length - 1];
      const hasImg = lastMsg?.attachment?.attachmentType === "medical_image" || lastMsg?.attachments?.some(a => a.attachmentType === "medical_image");
      const hasReport = lastMsg?.attachment?.attachmentType === "lab_report" || lastMsg?.attachments?.some(a => a.attachmentType === "lab_report");
      
      if (hasReport) return "Reviewing your report...";
      if (hasImg) return "Analysing the image...";
      return "Building clinical picture...";
    }
    if (chatStatus === "streaming") {
      const lastMsg = messages[messages.length - 1];
      const hasReport = lastMsg?.attachment?.attachmentType === "lab_report" || lastMsg?.attachments?.some(a => a.attachmentType === "lab_report");
      if (hasReport) return "Reviewing your report...";
      return "Preparing assessment...";
    }
    return "";
  }, [chatStatus, messages]);

  const processNextInQueue = useCallback(async () => {
    if (isProcessingRef.current || messageQueueRef.current.length === 0) {
      return;
    }

    const currentConsultationId = activeCaseIdRef.current;

    const nextItem = messageQueueRef.current.shift();
    setQueuedCount(messageQueueRef.current.length);
    if (!nextItem) return;

    // Defensive validation: ensure queued item belongs to this consultation
    if (nextItem.consultationId && nextItem.consultationId !== currentConsultationId) {
      console.warn("[Aegis] Purging queued message from mismatched consultation:", nextItem.consultationId);
      return;
    }

    isProcessingRef.current = true;
    setChatStatus("sending");
    setError(null);

    const { content, attachment: attachmentInput } = nextItem;
    const trimmed = content.trim();
    const attachmentsList = attachmentInput
      ? Array.isArray(attachmentInput)
        ? attachmentInput
        : [attachmentInput]
      : [];

    const hasAttachment = attachmentsList.length > 0;
    const firstAtt = attachmentsList[0];
    let userMsgContent = trimmed;

    if (!userMsgContent && hasAttachment) {
      if (firstAtt.attachmentType === "medical_image") {
        userMsgContent =
          attachmentsList.length > 1
            ? `Uploaded ${attachmentsList.length} physical health photos for visual assessment.`
            : `Uploaded photo: ${firstAtt.fileName}`;
      } else {
        userMsgContent = `Uploaded report: ${firstAtt.fileName}`;
      }
    }

    const userMessageId = generateUUID();
    const optimisticUserMessage: ChatMessage = {
      id: userMessageId,
      consultationId: currentConsultationId || undefined,
      role: "user",
      content: userMsgContent,
      timestamp: new Date(),
      attachment: firstAtt
        ? {
            name: firstAtt.fileName,
            type: firstAtt.mimeType,
            size: firstAtt.fileSize,
            dataUrl: firstAtt.dataUrl,
            attachmentType: firstAtt.attachmentType,
          }
        : undefined,
      attachments:
        attachmentsList.length > 1
          ? attachmentsList.map((a) => ({
              name: a.fileName,
              type: a.mimeType,
              size: a.fileSize,
              dataUrl: a.dataUrl,
              attachmentType: a.attachmentType,
            }))
          : undefined,
    };

    const assistantId = generateUUID();
    const optimisticAssistantMessage: ChatMessage = {
      id: assistantId,
      consultationId: currentConsultationId || undefined,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    // Performance instrumentation
    const t0 = performance.now();
    let tFirstToken: number | null = null;
    let accumulatedText = "";
    let pendingStreamBuffer = "";
    let streamRafId: number | null = null;

    const flushStreamBuffer = () => {
      if (!pendingStreamBuffer) return;
      accumulatedText += pendingStreamBuffer;
      pendingStreamBuffer = "";
      const textToFlush = accumulatedText;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: textToFlush,
              }
            : message
        )
      );
    };

    // Render optimistic user message immediately and create the streaming assistant slot
    setMessages((prev) => {
      // Validate isolation: only retain messages belonging to current consultation
      const validated = validateMessagesIsolation(prev, currentConsultationId);
      return [...validated, optimisticUserMessage, optimisticAssistantMessage];
    });
    setChatStatus("thinking");
    const t1 = performance.now();
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[Hippocrates Speed] T0->T1 (Optimistic UI Render): ${(t1 - t0).toFixed(1)}ms`);
    }

    let hasError = false;

    try {
      await api.sendMessageStream(
        {
          message: trimmed,
          model,
          persona,
          caseId: currentConsultationId || undefined,
          attachment: firstAtt,
          attachments: attachmentsList.length > 1 ? attachmentsList : undefined,
          attachmentType: firstAtt?.attachmentType,
          history: messagesRef.current.slice(-20).map(m => ({
            role: m.role,
            content: m.content,
            attachment: m.attachment,
            attachments: m.attachments,
          }))
        },
        {
          onInit: (data) => {
            if (data.caseId) {
              setActiveCaseId(data.caseId);
              activeCaseIdRef.current = data.caseId;
              setActiveConsultationId(data.caseId);
              onCasesChanged?.();
            }
          },
          onDelta: (delta) => {
            if (tFirstToken === null) {
              tFirstToken = performance.now();
              if (process.env.NODE_ENV !== "production") {
                console.debug(`[Hippocrates Speed] TTFT (Time To First Token): ${(tFirstToken - t0).toFixed(1)}ms`);
              }
              // Instantaneous first-token dispatch: 0ms added delay
              accumulatedText = delta;
              setChatStatus("streaming");
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId
                    ? {
                        ...message,
                        content: accumulatedText,
                      }
                    : message
                )
              );
              return;
            }

            // Buffer subsequent tokens and flush at display refresh rate (~60fps / 16ms)
            pendingStreamBuffer += delta;
            if (streamRafId === null && typeof window !== "undefined") {
              streamRafId = window.requestAnimationFrame(() => {
                streamRafId = null;
                flushStreamBuffer();
              });
            }
          },
          onDone: (response) => {
            if (streamRafId !== null && typeof window !== "undefined") {
              window.cancelAnimationFrame(streamRafId);
              streamRafId = null;
            }
            flushStreamBuffer();

            const tComplete = performance.now();
            if (process.env.NODE_ENV !== "production") {
              console.debug(
                `[Hippocrates Speed] Stream Completed: Total Duration ${(tComplete - t0).toFixed(1)}ms, TTFT ${
                  tFirstToken ? (tFirstToken - t0).toFixed(1) : "N/A"
                }ms`
              );
            }
            if (response.safetyEvaluation) {
              setSafetyEvaluation(response.safetyEvaluation);
            }
            if (response.assessmentStatus) {
              setAssessmentStatus(response.assessmentStatus);
            }
            if (response.urgencyLevel) {
              setUrgencyLevel(response.urgencyLevel);
            }
            const finalCaseId: string = response.caseId || currentConsultationId || generateUUID();
            setActiveCaseId(finalCaseId);
            activeCaseIdRef.current = finalCaseId;
            setActiveConsultationId(finalCaseId);

            setMessages((prev) => {
              const updated = prev.map((message) =>
                message.id === assistantId
                  ? {
                      ...(response.messages?.assistant ?? message),
                      consultationId: finalCaseId,
                      content: response.reply || message.content,
                      isStreaming: false,
                      safetyEvaluation: response.safetyEvaluation,
                      reportAnalysis: response.reportAnalysis,
                    }
                  : message.id === userMessageId && response.messages?.user
                    ? { ...response.messages.user, consultationId: finalCaseId }
                    : message
              );

              const existingLocal = loadConsultationState(finalCaseId);
              const updatedLocalState = extractInstantaneousCaseUpdates(
                trimmed,
                existingLocal?.caseState || createCleanCaseState(finalCaseId)
              );

              // Persist isolated state in localStorage for offline resilience
              const mergedState: AegisCaseState = {
                ...updatedLocalState,
                assessment_status: (response.assessmentStatus as AegisCaseState["assessment_status"]) || updatedLocalState.assessment_status,
                assessment_completeness: (response.assessmentStatus as AegisCaseState["assessment_completeness"]) || updatedLocalState.assessment_completeness,
                urgency_level: (response.urgencyLevel as AegisCaseState["urgency_level"]) || updatedLocalState.urgency_level,
              };

              saveConsultationState({
                consultationId: finalCaseId,
                createdAt: existingLocal?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: updated,
                caseState: mergedState,
                clinicalSummary: existingLocal?.clinicalSummary || null,
                doctorNote: existingLocal?.doctorNote || null,
              });

              return updated;
            });
            setChatStatus("completed");
            onCasesChanged?.();
          },
          onError: (err?: Error) => {
            if (streamRafId !== null && typeof window !== "undefined") {
              window.cancelAnimationFrame(streamRafId);
              streamRafId = null;
            }
            flushStreamBuffer();

            hasError = true;
            let humanMessage = "Something went wrong while generating the response.";
            const errMsg = err?.message || "";
            if (
              errMsg.includes("API key not valid") ||
              errMsg.includes("UNAUTHENTICATED") ||
              errMsg.includes("API_KEY_INVALID") ||
              errMsg.includes("MISSING_GEMINI_API_KEY") ||
              errMsg.includes("unable to connect")
            ) {
              humanMessage = "Unable to connect to the AI engine: Invalid or expired Gemini API key. Please configure a valid key from Google AI Studio (aistudio.google.com) in .env.local or Admin Settings.";
            }
            setError(humanMessage);
            setChatStatus("error");

            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantId
                  ? {
                      ...item,
                      content: humanMessage,
                      isStreaming: false,
                    }
                  : item
              )
            );
          },
        }
      );
    } catch {
      hasError = true;
      const humanMessage = "Something went wrong while generating the response.";
      setError(humanMessage);
      setChatStatus("error");
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content: humanMessage,
                isStreaming: false,
              }
            : item
        )
      );
    } finally {
      isProcessingRef.current = false;
      if (!hasError) {
        setChatStatus("idle");
      }
      // Process next queued message if any exists
      if (messageQueueRef.current.length > 0) {
        void processNextInQueue();
      }
    }
  }, [model, persona, onCasesChanged]);

  const sendMessage = useCallback(
    async (
      content: string,
      attachmentInput?: ChatAttachmentPayload | ChatAttachmentPayload[]
    ) => {
      const trimmed = content.trim();
      const hasAttachment = Boolean(
        attachmentInput &&
          (Array.isArray(attachmentInput) ? attachmentInput.length > 0 : true)
      );

      if (!trimmed && !hasAttachment) return;

      const currentId = activeCaseIdRef.current;

      // Queue the message with its consultation ID
      const queuedItem: QueuedMessage = {
        id: generateUUID(),
        consultationId: currentId || undefined,
        content,
        attachment: attachmentInput,
      };

      messageQueueRef.current.push(queuedItem);
      setQueuedCount(messageQueueRef.current.length);

      if (!isProcessingRef.current) {
        void processNextInQueue();
      }
    },
    [processNextInQueue]
  );

  const retryLastMessage = useCallback(async () => {
    if (messages.length === 0 || isProcessingRef.current) return;

    // Find the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    // Remove the failed assistant message AND the last user message from the list
    setMessages((prev) => {
      let sliceIndex = prev.length;
      const lastMsg = prev[sliceIndex - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        sliceIndex -= 1;
      }
      const prevMsg = prev[sliceIndex - 1];
      if (prevMsg && prevMsg.role === "user") {
        sliceIndex -= 1;
      }
      return prev.slice(0, sliceIndex);
    });

    const mappedAttachment: ChatAttachmentPayload | undefined = lastUserMsg.attachment?.fileBase64
      ? {
          fileBase64: lastUserMsg.attachment.fileBase64,
          mimeType: lastUserMsg.attachment.type,
          fileName: lastUserMsg.attachment.name,
          fileSize: lastUserMsg.attachment.size,
          dataUrl: lastUserMsg.attachment.dataUrl,
          attachmentType: lastUserMsg.attachment.attachmentType,
        }
      : undefined;

    await sendMessage(lastUserMsg.content, mappedAttachment);
  }, [messages, sendMessage]);

  const regenerate = useCallback(
    async (messageId: string) => {
      const messageIndex = messages.findIndex((message) => message.id === messageId);
      if (messageIndex === -1) return;

      const userMessage = messages
        .slice(0, messageIndex)
        .reverse()
        .find((message) => message.role === "user");

      if (!userMessage) return;

      setMessages((prev) => prev.filter((message) => message.id !== messageId));
      await sendMessage(userMessage.content);
    },
    [messages, sendMessage]
  );

  const clearMessages = useCallback(() => {
    startNewConsultation();
  }, [startNewConsultation]);

  const loadCase = useCallback(async (caseId: string) => {
    setIsCaseLoading(true);
    // Explicitly reset React state first to prevent bleed while loading
    setMessages([]);
    setSafetyEvaluation(null);
    setAssessmentStatus("INCOMPLETE");
    setUrgencyLevel("ROUTINE");
    setError(null);
    setActiveCaseId(caseId);
    activeCaseIdRef.current = caseId;
    setActiveConsultationId(caseId);

    try {
      const caseRecord = await api.getCase(caseId);
      if (caseRecord && caseRecord.id === caseId) {
        const taggedMessages = (caseRecord.messages || []).map((m) => ({
          ...m,
          consultationId: caseId,
        }));
        setMessages(taggedMessages);
        setChatStatus("idle");
        setError(null);

        const meta = (caseRecord.metadata as Record<string, unknown> | undefined) || {};
        const caseStateMeta = (meta.aegisCaseState || meta.case_state || meta.caseState) as Record<string, unknown> | undefined;

        let resolvedStatus = String(
          meta.assessment_status ||
          caseStateMeta?.assessment_status ||
          caseStateMeta?.assessment_completeness ||
          ""
        );

        const resolvedUrgency = String(
          meta.urgency_level ||
          caseStateMeta?.urgency_level ||
          ""
        );

        if (resolvedUrgency) {
          setUrgencyLevel(resolvedUrgency);
        }

        // If an old chat doesn't have an explicit status saved, evaluate its messages:
        if (!resolvedStatus || resolvedStatus === "INCOMPLETE") {
          const assistantMessages = taggedMessages.filter((m) => m.role === "assistant");
          if (assistantMessages.length >= 2) {
            const lastAssistant = assistantMessages[assistantMessages.length - 1];
            if (lastAssistant) {
              const determined = determineAssessmentStatusFromResponse(lastAssistant.content, "INCOMPLETE");
              if (determined !== "INCOMPLETE") {
                resolvedStatus = determined;
              } else if (assistantMessages.length >= 3) {
                resolvedStatus = "SUFFICIENT_FOR_PROVISIONAL_ASSESSMENT";
              }
            }
          }
        }

        if (resolvedStatus) {
          setAssessmentStatus(resolvedStatus);
        }

        // Update local isolated consultation cache
        saveConsultationState({
          consultationId: caseId,
          createdAt: caseRecord.createdAt,
          updatedAt: caseRecord.updatedAt,
          messages: taggedMessages,
          caseState: caseStateMeta
            ? { ...createCleanCaseState(caseId), ...caseStateMeta }
            : createCleanCaseState(caseId),
          clinicalSummary: null,
          doctorNote: null,
        });
      }
    } catch (err) {
      console.warn("[useChat] Could not load case from API, checking local consultation state:", err);
      // Offline / database paused fallback: try strictly this consultation's local storage
      const local = loadConsultationState(caseId);
      if (local && local.consultationId === caseId) {
        setMessages(local.messages);
      } else {
        // Never load a previous consultation. Start empty for this ID.
        setMessages([]);
      }
    } finally {
      setIsCaseLoading(false);
    }
  }, []);

  return {
    activeCaseId,
    messages,
    isLoading,
    isStreaming,
    isCaseLoading,
    chatStatus,
    statusText: getStatusText(),
    queuedCount,
    safetyEvaluation,
    assessmentStatus,
    urgencyLevel,
    error,
    sendMessage,
    regenerate,
    retryLastMessage,
    clearMessages,
    startNewConsultation,
    loadCase,
  };
}
