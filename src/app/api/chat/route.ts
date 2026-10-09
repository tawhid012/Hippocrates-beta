import { apiError, ok, parseJsonError } from "@/lib/api/response";
import { askOracleService, askOracleServiceStream, getUserFacingOracleError } from "@/services/oracle/oracleService";
import { askAegisService, askAegisServiceStream, AegisServiceError, stripInternalCaseState } from "@/services/aegis/aegisService";
import {
  addCaseMessage,
  createCase,
  getOracleHistory,
  renameCase,
  getCase,
  updateCaseMetadata,
} from "@/lib/cases/repository";
import type { ReportAnalysisResult, SafetyEvaluation } from "@/lib/types";
import {
  parseCaseStateFromMetadata,
  buildCaseStateMetadataUpdate,
  extractInstantaneousCaseUpdates,
  createCleanCaseState,
  validateCaseStateIsolation,
  type AegisCaseState,
} from "@/services/aegis/aegisCaseState";
import { getClientSessionId } from "@/lib/auth/session";

function deriveCaseTitle(message: string, fileName?: string) {
  if (fileName) return `Report: ${fileName}`;
  const compact = message.replace(/\s+/g, " ").trim();
  if (!compact) return "Untitled Session";
  return compact.length > 54 ? `${compact.slice(0, 54)}…` : compact;
}

export async function POST(request: Request) {
  let body: {
    message?: unknown;
    caseId?: unknown;
    model?: unknown;
    persona?: unknown;
    workspace?: unknown;
    stream?: unknown;
    attachment?: {
      fileBase64?: string;
      mimeType?: string;
      fileName?: string;
      fileSize?: number;
    };
    history?: Array<{
      role: string;
      content: string;
      attachment?: unknown;
      attachments?: unknown[];
    }>;
  };

  try {
    body = await request.json();
  } catch {
    return parseJsonError();
  }

  const rawMessage = typeof body.message === "string" ? body.message.trim() : "";
  const attachment = body.attachment;
  const wantsStream = body.stream !== false;

  if (!rawMessage && !attachment?.fileBase64) {
    return apiError("Please enter a question or attachment.", 400);
  }

  const isAegis =
    body.workspace === "aegis" ||
    body.persona === "patient" ||
    (typeof body.model === "string" && body.model.startsWith("aegis"));

  const caseIdStr = typeof body.caseId === "string" && body.caseId ? body.caseId : null;
  const isNewCase = !caseIdStr;

  if (isAegis) {
    try {
      const sessionId = await getClientSessionId();
      const existingCase = caseIdStr ? await getCase(caseIdStr, undefined, sessionId) : null;
      const finalCaseId = caseIdStr || crypto.randomUUID();

      const history = body.history && Array.isArray(body.history)
        ? body.history.map((m) => ({
            role: (m.role === "assistant" || m.role === "system" ? m.role : "user") as "user" | "assistant" | "system",
            content: typeof m.content === "string" ? m.content : "",
          }))
        : (existingCase
            ? existingCase.messages.slice(-20).map((msg) => ({
                role: (msg.role === "assistant" ? "assistant" : "user") as "user" | "assistant" | "system",
                content: msg.content,
                attachment: msg.attachment,
                attachments: msg.attachments,
                reportAnalysis: msg.reportAnalysis,
                visualAnalysisSummary: msg.visualAnalysisSummary,
              }))
            : []);

      if (!existingCase) {
        await createCase(deriveCaseTitle(rawMessage, attachment?.fileName), "aegis", undefined, undefined, undefined, finalCaseId, sessionId);
      }

      // Load case state strictly scoped to this consultation — no cross-consultation carryover
      let currentCaseState: AegisCaseState = createCleanCaseState(finalCaseId);
      if (existingCase?.metadata) {
        const parsed = parseCaseStateFromMetadata(existingCase.metadata as Record<string, unknown>);
        currentCaseState = validateCaseStateIsolation(parsed, finalCaseId);
      }
      currentCaseState = extractInstantaneousCaseUpdates(rawMessage, currentCaseState);

      const userMessageContent = rawMessage || `Uploaded report: ${attachment?.fileName || "Document"}`;
      const userMsgPromise = addCaseMessage(finalCaseId, "user", userMessageContent, {
        attachment: attachment
          ? {
              name: attachment.fileName || "Medical Report",
              type: attachment.mimeType || "application/pdf",
              size: attachment.fileSize,
            }
          : undefined,
      });

      const attachmentsInput = attachment?.fileBase64 && attachment?.mimeType
        ? {
            fileBase64: attachment.fileBase64,
            mimeType: attachment.mimeType,
            fileName: attachment.fileName || "Medical Report",
            fileSize: attachment.fileSize,
          }
        : undefined;

      if (!wantsStream) {
        const aegisRes = await askAegisService(rawMessage, history, attachmentsInput, undefined, currentCaseState);
        const cleanReply = stripInternalCaseState(aegisRes.reply);
        const userMessage = await userMsgPromise;
        const assistantMessage = await addCaseMessage(finalCaseId, "assistant", cleanReply, {
          reportAnalysis: aegisRes.reportAnalysis,
        });

        if (isNewCase) {
          await renameCase(finalCaseId, deriveCaseTitle(rawMessage, attachment?.fileName));
        }

        // Persist case state
        void updateCaseMetadata(finalCaseId, buildCaseStateMetadataUpdate(currentCaseState)).catch(() => {});

        const statusGate = currentCaseState.assessment_status || currentCaseState.assessment_completeness || "INCOMPLETE";

        return ok({
          reply: cleanReply,
          caseId: finalCaseId,
          model: "aegis-core",
          safetyEvaluation: aegisRes.safetyEvaluation,
          reportAnalysis: aegisRes.reportAnalysis,
          assessmentStatus: statusGate,
          urgencyLevel: currentCaseState.urgency_level || "ROUTINE",
          messages: {
            user: userMessage,
            assistant: assistantMessage,
          },
        });
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(`event: init\ndata: ${JSON.stringify({ caseId: finalCaseId })}\n\n`)
            );

            let fullReply = "";
            let finalSafety: SafetyEvaluation | undefined;
            let finalReportAnalysis: ReportAnalysisResult | undefined;

            for await (const chunk of askAegisServiceStream(rawMessage, history, attachmentsInput, undefined, currentCaseState)) {
              if (chunk.type === "delta" && chunk.text) {
                fullReply += chunk.text;
                controller.enqueue(
                  encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: chunk.text })}\n\n`)
                );
              } else if (chunk.type === "done_meta") {
                if (chunk.safetyEvaluation) finalSafety = chunk.safetyEvaluation;
                if (chunk.reportAnalysis) finalReportAnalysis = chunk.reportAnalysis;
              }
            }

            const cleanStreamReply = stripInternalCaseState(fullReply);

            const userMessage = await userMsgPromise;
            const assistantMessage = await addCaseMessage(finalCaseId, "assistant", cleanStreamReply, {
              reportAnalysis: finalReportAnalysis,
            });

            if (isNewCase) {
              await renameCase(finalCaseId, deriveCaseTitle(rawMessage, attachment?.fileName)).catch(() => {});
            }

            // Persist updated case state
            void updateCaseMetadata(finalCaseId, buildCaseStateMetadataUpdate(currentCaseState)).catch(() => {});

            const statusGate = currentCaseState.assessment_status || currentCaseState.assessment_completeness || "INCOMPLETE";

            controller.enqueue(
              encoder.encode(
                `event: done\ndata: ${JSON.stringify({
                  caseId: finalCaseId,
                  reply: cleanStreamReply,
                  model: "aegis-core",
                  safetyEvaluation: finalSafety,
                  reportAnalysis: finalReportAnalysis,
                  assessmentStatus: statusGate,
                  urgencyLevel: currentCaseState.urgency_level || "ROUTINE",
                  messages: {
                    user: userMessage,
                    assistant: assistantMessage,
                  },
                })}\n\n`
              )
            );


            controller.close();
          } catch (err) {
            const msg =
              err instanceof AegisServiceError
                ? err.userFacingMessage
                : (err as Error)?.message || "Aegis is temporarily unable to respond. Please try again.";
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    } catch (error) {
      if (error instanceof AegisServiceError) {
        return apiError(error.userFacingMessage, 500);
      }
      return apiError("Aegis is temporarily unable to respond. Please try again.", 500);
    }
  } else {
    // Oracle
    try {
      const sessionId = await getClientSessionId();
      const history = body.history && Array.isArray(body.history)
        ? body.history.map((m) => ({
            role: (m.role === "assistant" || m.role === "system" ? m.role : "user") as "user" | "assistant" | "system",
            content: typeof m.content === "string" ? m.content : "",
          }))
        : (caseIdStr ? await getOracleHistory(caseIdStr, sessionId) : []);
      const finalCaseId = caseIdStr || crypto.randomUUID();
      if (isNewCase) {
        await createCase(deriveCaseTitle(rawMessage), "oracle", undefined, undefined, undefined, finalCaseId, sessionId);
      }

      const userMsgPromise = addCaseMessage(finalCaseId, "user", rawMessage);

      if (!wantsStream) {
        const reply = await askOracleService(rawMessage, history);
        const userMessage = await userMsgPromise;
        const assistantMessage = await addCaseMessage(finalCaseId, "assistant", reply);

        if (isNewCase) {
          await renameCase(finalCaseId, deriveCaseTitle(rawMessage));
        }

        return ok({
          reply,
          caseId: finalCaseId,
          model: "oracle-core",
          messages: {
            user: userMessage,
            assistant: assistantMessage,
          },
        });
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(`event: init\ndata: ${JSON.stringify({ caseId: finalCaseId })}\n\n`)
            );

            let fullReply = "";
            for await (const chunk of askOracleServiceStream(rawMessage, history)) {
              fullReply += chunk;
              controller.enqueue(
                encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: chunk })}\n\n`)
              );
            }

            const userMessage = await userMsgPromise;
            const assistantMessage = await addCaseMessage(finalCaseId, "assistant", fullReply);

            if (isNewCase) {
              await renameCase(finalCaseId, deriveCaseTitle(rawMessage)).catch(() => {});
            }

            controller.enqueue(
              encoder.encode(
                `event: done\ndata: ${JSON.stringify({
                  caseId: finalCaseId,
                  reply: fullReply,
                  model: "oracle-core",
                  messages: {
                    user: userMessage,
                    assistant: assistantMessage,
                  },
                })}\n\n`
              )
            );

            controller.close();
          } catch (err) {
            const errorMsg = getUserFacingOracleError(err);
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify({ error: errorMsg })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    } catch (error) {
      return apiError(getUserFacingOracleError(error), 500);
    }
  }
}

