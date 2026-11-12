import "server-only";

import { GoogleGenAI } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini/client";
import { getGeminiCandidateModels } from "@/lib/gemini/config";
import {
  streamGeminiWithFastFailover,
  getAvailableCandidateModels,
  isFatalProviderError,
  markModelCooldown,
} from "@/lib/gemini/fastStream";
import { buildSanitizedGeminiContents } from "@/lib/gemini/contents";
import {
  AEGIS_SYSTEM_PROMPT,
  AEGIS_REPORT_PROMPT,
  AEGIS_IMAGE_ANALYSIS_PROMPT,
  AEGIS_SYSTEM_PROMPT_COMPACT,
} from "./aegisSystemPrompt";
import { evaluateSafety } from "@/lib/aegis/safety";
import {
  computeReportHash,
  getCachedReport,
  setCachedReport,
} from "./aegisCache";
import type {
  ReportAnalysisResult,
  SafetyEvaluation,
  LabResultStatus,
  AttachmentCategory,
} from "@/lib/types";
import type { AegisCaseState } from "./aegisCaseState";
import {
  buildCaseStateContext,
  extractInstantaneousCaseUpdates,
  EMPTY_CASE_STATE,
} from "./aegisCaseState";

export interface AegisAttachmentInput {
  fileBase64: string;
  mimeType: string;
  fileName: string;
  fileSize?: number;
  dataUrl?: string;
  attachmentType?: AttachmentCategory;
}

export interface AegisMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
  attachment?: {
    name: string;
    type: string;
    attachmentType?: AttachmentCategory;
  };
  attachments?: Array<{
    name: string;
    type: string;
    attachmentType?: AttachmentCategory;
  }>;
  reportAnalysis?: ReportAnalysisResult;
  visualAnalysisSummary?: string;
}

export interface AegisServiceResponse {
  reply: string;
  safetyEvaluation: SafetyEvaluation;
  reportAnalysis?: ReportAnalysisResult;
  visualAnalysisSummary?: string;
}

export interface AegisStreamChunk {
  type: "delta" | "done_meta";
  text?: string;
  safetyEvaluation?: SafetyEvaluation;
  reportAnalysis?: ReportAnalysisResult;
  visualAnalysisSummary?: string;
}

export class AegisServiceError extends Error {
  userFacingMessage: string;
  constructor(userFacingMessage: string, rawError?: unknown) {
    const detailMsg = typeof rawError === "string" ? rawError : (rawError as Error)?.message;
    super(detailMsg || userFacingMessage, rawError !== undefined ? { cause: rawError } : undefined);
    this.userFacingMessage = userFacingMessage;
    this.name = "AegisServiceError";
    if (rawError !== undefined) {
      (this as unknown as { cause: unknown }).cause = rawError;
    }
  }
}

export function normalizeAttachmentMimeType(rawMime: string, fileName?: string): string {
  const lower = (rawMime || "").toLowerCase().trim();
  const ext = (fileName || "").split(".").pop()?.toLowerCase();

  if (lower.includes("pdf") || ext === "pdf") return "application/pdf";
  if (lower.includes("png") || ext === "png") return "image/png";
  if (lower.includes("webp") || ext === "webp") return "image/webp";
  if (lower.includes("heic") || ext === "heic") return "image/heic";
  if (lower.includes("heif") || ext === "heif") return "image/heif";
  if (lower.includes("jpeg") || lower.includes("jpg") || ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (lower.startsWith("image/")) return "image/jpeg";
  return "application/pdf";
}

function normalizeLabStatus(status: unknown): LabResultStatus {
  if (typeof status === "string") {
    const upper = status.toUpperCase().trim();
    if (
      upper === "LOW" ||
      upper === "HIGH" ||
      upper === "NORMAL" ||
      upper === "CRITICAL" ||
      upper === "ATTENTION"
    ) {
      return upper;
    }
  }
  return "UNKNOWN";
}

export function parseJsonSafely(raw: string): Record<string, unknown> | null {
  if (!raw || typeof raw !== "string") return null;
  let text = raw.trim();

  // 1. Strip markdown fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }

  // 2. Locate outermost JSON object boundaries
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  // 3. Attempt direct parse
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Continue to sanitize
  }

  // 4. Sanitize trailing commas before closing braces/brackets
  try {
    const sanitized = text.replace(/,\s*([\}\]])/g, "$1");
    const parsed = JSON.parse(sanitized);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Final fallback: return null
  }

  return null;
}

export function formatReportResponse(fileName: string, analysis: ReportAnalysisResult): string {
  const parts: string[] = [];
  parts.push(`I have analyzed **${fileName}**. Here is a clear summary of your report:\n`);

  if (analysis.overall_summary) {
    parts.push(`### Summary\n${analysis.overall_summary}\n`);
  }

  if (analysis.tests && analysis.tests.length > 0) {
    parts.push(`### Laboratory Results`);
    for (const test of analysis.tests) {
      const statusBadge = test.status ? ` **[${test.status}]**` : "";
      const unitStr = test.unit ? ` ${test.unit}` : "";
      const refStr = test.reference_range ? ` (Ref Range: ${test.reference_range})` : "";
      parts.push(`- **${test.test_name}**: ${test.value}${unitStr}${refStr}${statusBadge}`);
      if (test.explanation) {
        parts.push(`  *${test.explanation}*`);
      }
    }
    parts.push("");
  }

  if (analysis.key_findings && analysis.key_findings.length > 0) {
    parts.push(`### Key Findings`);
    for (const finding of analysis.key_findings) {
      parts.push(`- ${finding}`);
    }
    parts.push("");
  }

  if (analysis.red_flags && analysis.red_flags.length > 0) {
    parts.push(`### Items Requiring Doctor Attention`);
    for (const flag of analysis.red_flags) {
      parts.push(`- ${flag}`);
    }
    parts.push("");
  }

  if (analysis.questions_for_doctor && analysis.questions_for_doctor.length > 0) {
    parts.push(`### Questions for Your Doctor`);
    for (const q of analysis.questions_for_doctor) {
      parts.push(`- ${q}`);
    }
    parts.push("");
  }

  parts.push(
    `---\n*Disclaimer: This analysis helps you understand your medical report in simple terms. It does not replace an official interpretation or medical diagnosis from your doctor.*`
  );

  return parts.join("\n");
}

/**
 * Builds compact conversation context for Aegis to minimize prompt tokens and maximize inference speed.
 */
function buildAegisContents(
  prompt: string,
  history: AegisMessageInput[] = []
) {
  const historyInput = history.map((m) => {
    let extraContext = "";
    if (m.reportAnalysis?.overall_summary) {
      extraContext += `[Report Context: ${m.reportAnalysis.overall_summary}]\n`;
    }
    if (m.visualAnalysisSummary) {
      extraContext += `[Visual Context: ${m.visualAnalysisSummary.slice(0, 150)}...]\n`;
    }
    return {
      role: m.role,
      content: m.content,
      extraContext: extraContext || undefined,
    };
  });

  return buildSanitizedGeminiContents([{ text: prompt.trim() }], historyInput);
}

/**
 * Deterministically strips any internal Clinical Case State headers,
 * raw state enums, or debug sections from patient-facing responses.
 */
export function stripInternalCaseState(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Remove standard case state update block
  // e.g. ### Current Clinical Case State Update ... up to Urgency Level / Assessment Status Gate
  cleaned = cleaned.replace(
    /(?:#{1,6}\s*)?(?:Current\s+)?Clinical\s+Case\s+State(?:\s+Update)?[\s\S]*?(?:Assessment\s+Status(?:\s+Gate)?:\s*[^\n]+(?:\n+|$)|Urgency\s+Level:\s*[^\n]+(?:\n+|$))/gi,
    ""
  );

  // 2. Remove bracketed section blocks like [CURRENT CLINICAL CASE STATE]
  cleaned = cleaned.replace(
    /={3,}[\s\S]*?CURRENT CLINICAL CASE STATE[\s\S]*?={3,}/gi,
    ""
  );

  cleaned = cleaned.replace(
    /\[\d\.\s*(?:KNOWN\s*\/\s*(?:PRESENT|ABSENT)|UNKNOWN\s*\/\s*UNMEASURED)[^\]]*\][\s\S]*?(?=\n\n|\n[A-Z]|$)/gi,
    ""
  );

  // 3. Line-by-line cleaner for remaining state headers or stray list items
  const lines = cleaned.split("\n");
  const filteredLines: string[] = [];
  let inStateList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (
      /^#{1,6}\s*(?:Current\s+)?Clinical\s+Case\s+State(?:\s+Update)?/i.test(trimmed) ||
      /^(?:Current\s+)?Clinical\s+Case\s+State(?:\s+Update)?:?$/i.test(trimmed) ||
      /^#{1,6}\s*(?:Known\s*\/\s*(?:Present|Absent)|Unknown\s*\/\s*(?:Unmeasured|Not Established))/i.test(trimmed) ||
      /^(?:Known\s*\/\s*(?:Present|Absent)|Unknown\s*\/\s*(?:Unmeasured|Not Established)):?$/i.test(trimmed) ||
      /^(?:Assessment\s+Status(?:\s+Gate)?|Urgency\s+Level)\s*:\s*[A-Za-z_]+/i.test(trimmed)
    ) {
      inStateList = true;
      continue;
    }

    if (inStateList) {
      if (
        /^\s*[-*•]\s*(?:Onset|Location|Quality|Severity|Duration|Timing|Radiation|Known|Unknown|Pertinent|Red\s*Flags?|Medical\s*History|Medications?|Allergies|Fever|Nausea|Light|Sharpness|Throbbing|Pain|Assessment|Urgency)/i.test(line) ||
        /^\s*[-*•]\s*.*:\s*(?:PRESENT|ABSENT|UNKNOWN|UNMEASURED|INCOMPLETE|None|Normal)/i.test(line) ||
        /^\s*[-*•]\s*$/i.test(line) ||
        trimmed === ""
      ) {
        const nextLine = lines[i + 1]?.trim() || "";
        const nextIsSentence =
          nextLine.length > 0 &&
          !nextLine.startsWith("-") &&
          !nextLine.startsWith("*") &&
          !nextLine.startsWith("•") &&
          !nextLine.startsWith("#") &&
          !nextLine.includes(":") &&
          !nextLine.toLowerCase().startsWith("known") &&
          !nextLine.toLowerCase().startsWith("unknown");

        if (trimmed === "" && nextIsSentence) {
          inStateList = false;
        }
        continue;
      } else {
        inStateList = false;
      }
    }

    if (
      /^\s*[*•-]?\s*(?:Assessment\s+Status(?:\s+Gate)?|Urgency\s+Level)\s*:\s*[A-Za-z_]+/i.test(trimmed) ||
      /^\s*[*•-]?\s*(?:Light sensitivity|Temperature|Blood pressure|Severity|Onset|Location|Quality)\s*:\s*(?:UNKNOWN|UNMEASURED|NOT ESTABLISHED)/i.test(trimmed)
    ) {
      continue;
    }

    filteredLines.push(line);
  }

  cleaned = filteredLines.join("\n").replace(/^\n{2,}/, "\n").trim();
  return cleaned;
}

// Helper to stream with automatic model fallback, 2200ms TTFT fast-failover, and cooldown circuit breaker
async function* streamWithCandidateFallback(
  ai: GoogleGenAI,
  models: string[],
  params: { contents: unknown; config?: unknown }
): AsyncGenerator<{ text?: string }, void, unknown> {
  yield* streamGeminiWithFastFailover(ai, models, params, "[Aegis]");
}

/**
 * Dedicated multimodal extractor for lab/medical reports (PDFs, lab photos).
 * Uses a generous 35-second generation race per model, prioritizes JSON schema extraction,
 * provides plain-text fallback on the same model, and gracefully cascades to the next candidate model
 * if a model experiences 503 high demand or network timeout.
 */
async function generateReportContentWithFallback(
  ai: GoogleGenAI,
  models: string[],
  parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }>
): Promise<{ rawText: string; modelUsed: string }> {
  const prioritizedModels = getAvailableCandidateModels(models);
  let lastError: unknown = null;

  for (const model of prioritizedModels) {
    const t0 = Date.now();
    try {
      // 1. Primary: JSON-mode extraction with 35s timeout
      const generatePromise = ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          responseMimeType: "application/json",
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Model ${model} report extraction timeout (exceeded 35s)`)),
          35_000
        )
      );

      const res = await Promise.race([generatePromise, timeoutPromise]);
      const rawText = res.text?.trim() || "";
      if (rawText) {
        return { rawText, modelUsed: model };
      }
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Aegis] Model ${model} JSON report analysis failed after ${Date.now() - t0}ms:`, errMsg);

      if (isFatalProviderError(err)) {
        throw err;
      }

      // 2. Secondary fallback on same model: plain text mode in case model rejects responseMimeType
      try {
        const textFallbackPromise = ai.models.generateContent({
          model,
          contents: [{ role: "user", parts }],
        });
        const textRes = await Promise.race([
          textFallbackPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Model ${model} text fallback timeout`)), 20_000)
          ),
        ]);
        const textOutput = textRes.text?.trim() || "";
        if (textOutput) {
          return { rawText: textOutput, modelUsed: model };
        }
      } catch (fallbackErr: unknown) {
        console.warn(`[Aegis] Model ${model} plain text fallback also failed:`, fallbackErr);
      }

      // Mark model on cooldown if it failed (e.g. 503 high demand or timeout)
      markModelCooldown(model);
    }
  }

  throw lastError || new Error("All candidate models failed to analyze the report.");
}

/**
 * Streams Aegis responses natively with time-to-first-token optimization.
 */
export async function* askAegisServiceStream(
  userMessage: string,
  history: AegisMessageInput[] = [],
  attachmentsInput?: AegisAttachmentInput | AegisAttachmentInput[],
  apiKey?: string,
  caseState?: AegisCaseState | null
): AsyncGenerator<AegisStreamChunk, void, unknown> {
  const prompt = userMessage.trim();

  // Normalize attachments input
  const attachments: AegisAttachmentInput[] = attachmentsInput
    ? Array.isArray(attachmentsInput)
      ? attachmentsInput
      : [attachmentsInput]
    : [];

  const hasAttachment = attachments.length > 0 && attachments.some((a) => a.fileBase64);

  if (!prompt && !hasAttachment) {
    throw new AegisServiceError("Please enter a health question or attach a file.");
  }

  let ai;
  try {
    ai = await getGeminiClient(apiKey);
  } catch (err) {
    throw new AegisServiceError("Aegis is not configured. Please set the Gemini API key in the Admin Panel.", err);
  }

  const candidateModels = getGeminiCandidateModels();
  let safetyEval = evaluateSafety(prompt);

  const isImageAnalysis = attachments.some(
    (a) => a.attachmentType === "medical_image" || (a.mimeType.startsWith("image/") && a.attachmentType !== "lab_report")
  );

  // -------------------------------------------------------------
  // PATH A: Multimodal Physical Health Image Analysis (Streaming)
  // -------------------------------------------------------------
  if (hasAttachment && isImageAnalysis) {
    try {
      const parts: Array<
        | { inlineData: { mimeType: string; data: string } }
        | { text: string }
      > = [];

      for (const img of attachments) {
        if (img.fileBase64 && (img.mimeType.startsWith("image/") || img.attachmentType === "medical_image")) {
          // Remove potential data URL header if present and normalize MIME
          let mime = img.mimeType || "image/jpeg";
          const dataUrlMatch = img.fileBase64.match(/^data:([^;]+);base64,/);
          if (dataUrlMatch && dataUrlMatch[1]) {
            mime = dataUrlMatch[1];
          }
          mime = normalizeAttachmentMimeType(mime, img.fileName);
          const base64Data = img.fileBase64.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "").trim();
          parts.push({
            inlineData: {
              mimeType: mime,
              data: base64Data,
            },
          });
        }
      }

      const patientQuery = prompt ? `Patient's question: ${prompt}` : "Patient uploaded physical health photograph(s) for visual assessment.";
      parts.push({ text: patientQuery });

      const contents = buildSanitizedGeminiContents(
        parts,
        history.map((m) => ({ role: m.role, content: m.content }))
      );

      const responseStream = streamWithCandidateFallback(ai, candidateModels, {
        contents,
        config: {
          systemInstruction: `${AEGIS_SYSTEM_PROMPT}\n\n${AEGIS_IMAGE_ANALYSIS_PROMPT}`,
        },
      });

      let fullVisualReply = "";
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          fullVisualReply += text;
          yield { type: "delta", text };
        }
      }

      yield {
        type: "done_meta",
        safetyEvaluation: safetyEval,
        visualAnalysisSummary: fullVisualReply,
      };
      return;
    } catch (error: unknown) {
      const errStr = error instanceof Error ? error.message : String(error);
      throw new AegisServiceError(
        `Aegis was unable to process the uploaded image (${errStr}). Please try again.`,
        error
      );
    }
  }

  // -------------------------------------------------------------
  // PATH B: Lab / Medical Report Analysis (Structured Fast Extraction)
  // -------------------------------------------------------------
  if (hasAttachment && !isImageAnalysis) {
    const primaryAttachment = attachments[0];
    const fileName = primaryAttachment.fileName || "Medical Report";
    const tStart = Date.now();

    try {
      const normalizedMime = normalizeAttachmentMimeType(primaryAttachment.mimeType, primaryAttachment.fileName);
      const cleanBase64 = primaryAttachment.fileBase64
        .replace(/^data:[^;]+;base64,/, "")
        .replace(/\s+/g, "")
        .trim();

      if (!cleanBase64) {
        throw new AegisServiceError("The uploaded report is empty or unreadable. Please try again with a clear image or PDF.");
      }

      // 1. Check in-memory deduplication cache
      const cacheHash = computeReportHash(cleanBase64, prompt);
      const cached = getCachedReport(cacheHash);

      if (cached) {
        const formatted = cached.formattedReply;
        const chunkSize = 80;
        for (let i = 0; i < formatted.length; i += chunkSize) {
          yield { type: "delta", text: formatted.slice(i, i + chunkSize) };
        }

        const metrics = {
          cached: true,
          totalMs: Date.now() - tStart,
        };

        yield {
          type: "done_meta",
          safetyEvaluation: cached.safetyEvaluation,
          reportAnalysis: {
            ...cached.reportAnalysis,
            metrics,
          },
        };
        return;
      }

      // 2. Multimodal parts preparation
      const parts: Array<
        | { inlineData: { mimeType: string; data: string } }
        | { text: string }
      > = [
        {
          inlineData: {
            mimeType: normalizedMime,
            data: cleanBase64,
          },
        },
        {
          text: `${AEGIS_REPORT_PROMPT}\n\nPatient Note: ${prompt || "Analyze this report and return structured JSON."}`,
        },
      ];

      // 3. Robust multimodal extraction with candidate fallback and generous timeout
      const { rawText } = await generateReportContentWithFallback(ai, candidateModels, parts);
      const totalGenMs = Date.now() - tStart;

      let reportAnalysis: ReportAnalysisResult | undefined = undefined;
      const parsed = parseJsonSafely(rawText);

      if (parsed) {
        const resultsSource = Array.isArray(parsed.results)
          ? parsed.results
          : Array.isArray(parsed.tests)
          ? parsed.tests
          : [];

        const tests = resultsSource.map((r) => ({
          test_name: (r.test_name as string) || "Test",
          value: String(r.value || "N/A"),
          unit: (r.unit as string) || "",
          reference_range: (r.reference_range as string) || "N/A",
          status: normalizeLabStatus(r.status),
          explanation: (r.explanation as string) || "",
          requires_medical_review: Boolean(r.requires_medical_review),
        }));

        const redFlags = Array.isArray(parsed.potential_red_flags)
          ? (parsed.potential_red_flags as string[])
          : Array.isArray(parsed.red_flags)
          ? (parsed.red_flags as string[])
          : [];

        reportAnalysis = {
          report_type: (parsed.report_type as string) || "Medical Report",
          patient_name_or_id: (parsed.patient_name_or_id as string) || "Anonymous",
          report_date: (parsed.report_date as string) || "Unknown",
          lab_name: (parsed.lab_name as string) || "Laboratory",
          overall_summary: (parsed.overall_summary as string) || "Report analyzed successfully.",
          key_findings: Array.isArray(parsed.key_findings) ? (parsed.key_findings as string[]) : [],
          red_flags: redFlags,
          potential_red_flags: redFlags,
          questions_for_doctor: Array.isArray(parsed.questions_for_doctor) ? (parsed.questions_for_doctor as string[]) : [],
          tests,
          results: tests,
          metrics: {
            ttftMs: totalGenMs,
            extractionMs: totalGenMs,
            totalMs: Date.now() - tStart,
            cached: false,
          },
        };
      } else {
        reportAnalysis = {
          report_type: "Medical Report",
          tests: [],
          results: [],
          overall_summary: rawText || "Report uploaded and reviewed.",
          key_findings: [rawText],
          red_flags: [],
          potential_red_flags: [],
          questions_for_doctor: [],
          metrics: {
            ttftMs: totalGenMs,
            extractionMs: totalGenMs,
            totalMs: Date.now() - tStart,
            cached: false,
          },
        };
      }

      const formattedReply = formatReportResponse(fileName, reportAnalysis);

      // Stream the formatted response in chunks for immediate responsive rendering
      const chunkSize = 60;
      for (let i = 0; i < formattedReply.length; i += chunkSize) {
        yield { type: "delta", text: formattedReply.slice(i, i + chunkSize) };
      }

      if (reportAnalysis.red_flags && reportAnalysis.red_flags.length > 0) {
        const flagEval = evaluateSafety(reportAnalysis.red_flags.join(" "));
        if (flagEval.level === "POTENTIAL_EMERGENCY") {
          safetyEval = flagEval;
        }
      }

      // Save to cache for instant future reuse
      setCachedReport(cacheHash, reportAnalysis, safetyEval, formattedReply);

      yield {
        type: "done_meta",
        safetyEvaluation: safetyEval,
        reportAnalysis,
      };
      return;
    } catch (error: unknown) {
      if (error instanceof AegisServiceError) {
        throw error;
      }
      throw new AegisServiceError(
        "Aegis was unable to process the uploaded report. Please try again with a clear image or PDF.",
        error
      );
    }
  }

  // -------------------------------------------------------------
  // PATH C: Conversational Follow-Up Turn (Ultra-fast Streaming)
  // -------------------------------------------------------------
  const contents = buildAegisContents(prompt, history);

  // Instantly extract clinical updates from the latest message so Aegis is fully state-aware on this exact turn
  const activeCaseState = extractInstantaneousCaseUpdates(
    prompt,
    caseState || EMPTY_CASE_STATE
  );

  // Build system instruction: compact prompt + instantaneous state context with 3-way tracking & operational gates
  const systemInstruction = `${AEGIS_SYSTEM_PROMPT_COMPACT}\n\n${buildCaseStateContext(activeCaseState)}`;

  try {
    const responseStream = streamWithCandidateFallback(ai, candidateModels, {
      contents,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    let initialBuffer = "";
    let hasFlushedHeader = false;

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (!text) continue;

      if (!hasFlushedHeader) {
        initialBuffer += text;
        const trimmed = initialBuffer.trimStart();
        const looksLikeDebugHeader =
          /^(?:#{1,6}\s*)?(?:Current\s+)?Clinical\s+Case\s+State/i.test(trimmed) ||
          /^(?:\[\s*)?CURRENT CLINICAL CASE STATE/i.test(trimmed) ||
          /^(?:#{1,6}\s*)?Known\s*\/\s*(?:Present|Absent)/i.test(trimmed) ||
          /^(?:\[\s*)?INTERNAL CLINICAL/i.test(trimmed);

        if (looksLikeDebugHeader) {
          if (initialBuffer.includes("\n\n") || initialBuffer.length > 250) {
            const cleaned = stripInternalCaseState(initialBuffer);
            if (cleaned.length > 0) {
              hasFlushedHeader = true;
              yield { type: "delta", text: cleaned };
              initialBuffer = "";
            }
          }
        } else {
          hasFlushedHeader = true;
          yield { type: "delta", text: initialBuffer };
          initialBuffer = "";
        }
      } else {
        yield { type: "delta", text };
      }
    }

    if (!hasFlushedHeader && initialBuffer) {
      const remainingCleaned = stripInternalCaseState(initialBuffer);
      if (remainingCleaned) {
        yield { type: "delta", text: remainingCleaned };
      }
    }

    yield {
      type: "done_meta",
      safetyEvaluation: safetyEval,
    };
  } catch (error: unknown) {
    const errStr = String((error as Error)?.stack || (error as Error)?.message || error);
    if (errStr.includes("API_KEY_INVALID") || errStr.includes("API key not valid") || errStr.includes("MISSING_GEMINI_API_KEY")) {
      throw new AegisServiceError("Aegis is temporarily unable to connect. Please check configuration. " + errStr);
    }
    throw new AegisServiceError("Aegis is temporarily unable to respond. Please try again. " + errStr);
  }
}

/**
 * Handles patient health queries, report analysis, and multimodal physical health image analysis (non-streaming fallback).
 */
export async function askAegisService(
  userMessage: string,
  history: AegisMessageInput[] = [],
  attachmentsInput?: AegisAttachmentInput | AegisAttachmentInput[],
  apiKey?: string,
  caseState?: AegisCaseState | null
): Promise<AegisServiceResponse> {
  let reply = "";
  let safetyEvaluation: SafetyEvaluation = evaluateSafety(userMessage);
  let reportAnalysis: ReportAnalysisResult | undefined;
  let visualAnalysisSummary: string | undefined;

  for await (const chunk of askAegisServiceStream(userMessage, history, attachmentsInput, apiKey, caseState)) {
    if (chunk.type === "delta" && chunk.text) {
      reply += chunk.text;
    } else if (chunk.type === "done_meta") {
      if (chunk.safetyEvaluation) safetyEvaluation = chunk.safetyEvaluation;
      if (chunk.reportAnalysis) reportAnalysis = chunk.reportAnalysis;
      if (chunk.visualAnalysisSummary) visualAnalysisSummary = chunk.visualAnalysisSummary;
    }
  }

  return {
    reply: stripInternalCaseState(reply).trim(),
    safetyEvaluation,
    reportAnalysis,
    visualAnalysisSummary,
  };
}

