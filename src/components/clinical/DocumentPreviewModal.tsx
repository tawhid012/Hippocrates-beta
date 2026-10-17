"use client";

import {
  X,
  Download,
  Shield,
  AlertTriangle,
  Printer,
  Calendar,
  Clock,
  User,
  Stethoscope,
} from "lucide-react";
import type { NormalizedClinicalSummary } from "@/lib/clinical/types";
import { parseDrNote } from "@/lib/clinical/parseDrNote";

interface DocumentPreviewModalProps {
  summary: NormalizedClinicalSummary;
  isOpen: boolean;
  onClose: () => void;
  onDownloadPdf: () => void;
}

export function DocumentPreviewModal({
  summary,
  isOpen,
  onClose,
  onDownloadPdf,
}: DocumentPreviewModalProps) {
  if (!isOpen) return null;

  const parsedNote = summary.drNote ? parseDrNote(summary.drNote) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/40 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Background ambient glowing layout circles */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full bg-teal-300/20 blur-[130px] pointer-events-none -z-10 animate-pulse duration-[7000ms] print:hidden"
        style={{ top: "10%", left: "15%" }}
      />
      <div
        className="absolute w-[450px] h-[450px] rounded-full bg-blue-300/20 blur-[110px] pointer-events-none -z-10 animate-pulse duration-[5000ms] print:hidden"
        style={{ bottom: "10%", right: "15%" }}
      />

      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-3xl bg-card border border-border shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none text-foreground">
        {/* Header Bar */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-xs">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground tracking-tight">
                  Clinical Assessment & Care Plan
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 text-[10px] font-bold uppercase tracking-wider border border-teal-500/20">
                  {summary.status || "AI Generated"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Document ID:{" "}
                <span className="font-mono text-foreground font-semibold">
                  {summary.documentId || "N/A"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  window.print();
                } catch {
                  // Silently ignore if blocked
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-border bg-muted/60 hover:bg-muted text-foreground transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-7 bg-muted/30 text-foreground print:p-0 print:bg-white print:overflow-visible">
          {/* Top Brand Banner */}
          <div className="border-b border-slate-200/80 pb-5 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-serif text-2xl font-bold tracking-tight text-slate-900">
                  HIPPOCRATES
                </span>
                <span className="text-[10px] font-bold text-teal-700 tracking-wider uppercase bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Clinical Intelligence Platform
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(summary.generatedAt).toLocaleString()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground leading-snug">
              {summary.conversationTitle || "Clinical Conversation Summary & Care Plan"}
            </h1>
          </div>

          {/* Patient & Session Demographics Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 rounded-2xl bg-card border border-border shadow-xs text-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600" />

            <div className="space-y-2 pl-2">
              <p className="font-bold text-muted-foreground uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                <User className="h-3 w-3 text-muted-foreground" />
                <span>Patient Demographics</span>
              </p>
              <div className="space-y-1">
                <p>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  <span className="font-bold text-foreground">
                    {summary.patient?.name || "Not provided"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Age:</span>{" "}
                  <span className="font-semibold text-slate-800">
                    {summary.patient?.age || "Not provided"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Biological Sex:</span>{" "}
                  <span className="font-semibold text-slate-800">
                    {summary.patient?.sex || "Not provided"}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200/60 pt-3 md:pt-0 md:pl-5">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>Encounter Audit</span>
              </p>
              <div className="space-y-1">
                <p>
                  <span className="text-slate-500">Clinical Model:</span>{" "}
                  <span className="font-semibold text-slate-800">{summary.model}</span>
                </p>
                <p>
                  <span className="text-slate-500">Encounter Date:</span>{" "}
                  <span className="font-semibold text-slate-800">
                    {new Date(summary.generatedAt).toLocaleDateString()}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Encounter Time:</span>{" "}
                  <span className="font-semibold text-slate-800">
                    {new Date(summary.generatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200/60 pt-3 md:pt-0 md:pl-5">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>Record Reference</span>
              </p>
              <div className="space-y-1">
                <p>
                  <span className="text-slate-500">Document ID:</span>{" "}
                  <span className="font-mono font-bold text-slate-900">
                    {summary.documentId || "N/A"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Session ID:</span>{" "}
                  <span className="font-mono text-slate-600 text-[10px]">
                    {(summary.conversationId || "N/A").slice(0, 16)}...
                  </span>
                </p>
                {summary.elevenlabsConversationId && (
                  <p>
                    <span className="text-slate-500">Voice Session:</span>{" "}
                    <span className="font-mono text-slate-600 text-[10px]">
                      {(summary.elevenlabsConversationId || "N/A").slice(0, 12)}...
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Triage / Risk Status Alert Card */}
          {summary.riskStatus && summary.riskStatus !== "UNKNOWN" && (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-semibold ${
                summary.riskStatus === "EMERGENCY"
                  ? "bg-red-50/80 border-red-200 text-red-900"
                  : summary.riskStatus === "URGENT"
                  ? "bg-amber-50/80 border-amber-200 text-amber-900"
                  : summary.riskStatus === "ROUTINE"
                  ? "bg-blue-50/80 border-blue-200 text-blue-900"
                  : "bg-teal-50/80 border-teal-200 text-teal-900"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  summary.riskStatus === "EMERGENCY"
                    ? "bg-red-600 animate-pulse"
                    : summary.riskStatus === "URGENT"
                    ? "bg-amber-600"
                    : summary.riskStatus === "ROUTINE"
                    ? "bg-blue-600"
                    : "bg-teal-600"
                }`}
              />
              <span className="font-bold uppercase tracking-wider text-[11px]">
                TRIAGE STATUS: {summary.riskStatus}
              </span>
              <span className="text-slate-700 font-normal">
                —{" "}
                {summary.clinicalSnapshot?.urgencyStatement ||
                  "Routine medical evaluation recommended to investigate reported symptoms."}
              </span>
            </div>
          )}

          {/* Clinical Snapshot Card (Phase 2 at-a-glance section) */}
          {summary.clinicalSnapshot && (
            <section className="rounded-2xl border border-teal-200/80 bg-teal-50/30 p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-teal-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-teal-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                    Clinical Snapshot
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-md">
                  Rapid Clinical Review (30-Sec Synthesis)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                      Primary Concern
                    </p>
                    <p className="text-slate-900 font-semibold mt-0.5 text-sm">
                      {summary.clinicalSnapshot.primaryConcern}
                    </p>
                  </div>

                  {(summary.clinicalSnapshot.durationSummary ||
                    summary.clinicalSnapshot.severitySummary) && (
                    <div className="flex gap-4 text-xs bg-white/80 p-2.5 rounded-xl border border-teal-100">
                      {summary.clinicalSnapshot.durationSummary && (
                        <div>
                          <span className="text-slate-400 text-[10px] block font-bold uppercase">
                            Duration
                          </span>
                          <span className="font-semibold text-slate-800">
                            {summary.clinicalSnapshot.durationSummary}
                          </span>
                        </div>
                      )}
                      {summary.clinicalSnapshot.severitySummary && (
                        <div>
                          <span className="text-slate-400 text-[10px] block font-bold uppercase">
                            Severity
                          </span>
                          <span className="font-semibold text-slate-800">
                            {summary.clinicalSnapshot.severitySummary}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {summary.clinicalSnapshot.keyPositiveFindings.length > 0 && (
                    <div>
                      <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                        Key Positive Findings
                      </p>
                      <ul className="space-y-1">
                        {summary.clinicalSnapshot.keyPositiveFindings.map((f, i) => (
                          <li
                            key={i}
                            className="text-slate-800 flex items-start gap-1.5 text-xs"
                          >
                            <span className="text-teal-600 font-bold shrink-0">+</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summary.clinicalSnapshot.keyNegativeFindings.length > 0 && (
                    <div>
                      <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                        Pertinent Negatives (Explicitly Denied)
                      </p>
                      <ul className="space-y-1">
                        {summary.clinicalSnapshot.keyNegativeFindings.map((f, i) => (
                          <li
                            key={i}
                            className="text-slate-600 flex items-start gap-1.5 text-xs"
                          >
                            <span className="text-slate-400 shrink-0 font-bold">–</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {summary.clinicalSnapshot.keyClinicalConsideration && (
                <div className="pt-3 border-t border-teal-200/60 bg-white/60 p-3 rounded-xl border border-teal-100">
                  <p className="text-xs italic text-slate-700">
                    <span className="font-bold text-teal-900 not-italic">
                      Key Clinical Consideration:{" "}
                    </span>
                    {summary.clinicalSnapshot.keyClinicalConsideration}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Reason for Assessment */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-teal-600 rounded-full" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Reason for Assessment
              </h3>
            </div>
            <div className="text-sm leading-relaxed bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm text-slate-800">
              {summary.consultationReason}
            </div>
          </section>

          {/* Presenting Symptoms & Metric Chips */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-teal-600 rounded-full" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Presenting Symptoms
              </h3>
            </div>
            <div className="text-sm space-y-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm text-slate-800">
              <p>
                <span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Primary Symptom:
                </span>{" "}
                <span className="font-bold text-slate-900 text-base ml-1">
                  {summary.symptoms.primarySymptom}
                </span>
              </p>

              {(summary.symptoms.duration ||
                summary.symptoms.severity ||
                summary.symptoms.frequency) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Duration
                    </span>
                    <span className="font-semibold text-slate-900 mt-0.5 block break-words leading-snug">
                      {summary.symptoms.duration || "Not specified"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Severity
                    </span>
                    <span className="font-semibold text-slate-900 mt-0.5 block break-words leading-snug">
                      {summary.symptoms.severity || "Not specified"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Frequency
                    </span>
                    <span className="font-semibold text-slate-900 mt-0.5 block break-words leading-snug">
                      {summary.symptoms.frequency || "Not specified"}
                    </span>
                  </div>
                </div>
              )}

              {summary.symptoms.associatedSymptoms &&
                summary.symptoms.associatedSymptoms.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-700 mb-2">
                      Associated Symptoms Reported:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {summary.symptoms.associatedSymptoms.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {summary.pertinentNegatives && summary.pertinentNegatives.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-700 mb-2">
                    Pertinent Negatives (Patient Specifically Denied):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.pertinentNegatives.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-medium"
                      >
                        – {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Relevant Medical History */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-teal-600 rounded-full" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Relevant Medical History
              </h3>
            </div>
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm text-xs space-y-2">
              {summary.history.previousConditions?.length ||
              summary.history.currentMedications?.length ||
              summary.history.allergies?.length ||
              summary.history.recentIllnessExposure ||
              summary.history.lifestyleFactors ? (
                <div className="space-y-2">
                  {summary.history.previousConditions &&
                    summary.history.previousConditions.length > 0 && (
                      <p>
                        <span className="font-bold text-slate-600">Prior Conditions:</span>{" "}
                        <span className="text-slate-800">
                          {summary.history.previousConditions.join(", ")}
                        </span>
                      </p>
                    )}
                  {summary.history.currentMedications &&
                    summary.history.currentMedications.length > 0 && (
                      <p>
                        <span className="font-bold text-slate-600">Current Medications:</span>{" "}
                        <span className="text-slate-800">
                          {summary.history.currentMedications.join(", ")}
                        </span>
                      </p>
                    )}
                  {summary.history.allergies && summary.history.allergies.length > 0 && (
                    <p>
                      <span className="font-bold text-slate-600">Allergies:</span>{" "}
                      <span className="text-slate-800">
                        {summary.history.allergies.join(", ")}
                      </span>
                    </p>
                  )}
                  {summary.history.recentIllnessExposure && (
                    <p>
                      <span className="font-bold text-slate-600">Recent Exposure / Illness:</span>{" "}
                      <span className="text-slate-800">
                        {summary.history.recentIllnessExposure}
                      </span>
                    </p>
                  )}
                  {summary.history.lifestyleFactors && (
                    <p>
                      <span className="font-bold text-slate-600">Lifestyle / Context:</span>{" "}
                      <span className="text-slate-800">
                        {summary.history.lifestyleFactors}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  No prior chronic medical conditions, regular medications, or allergies
                  reported during consultation.
                </p>
              )}
            </div>
          </section>

          {/* Structured Clinical Considerations (Differential Diagnosis) */}
          {summary.clinicalConsiderations && summary.clinicalConsiderations.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-slate-800 rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Clinical Considerations
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Differential (Preliminary)
                </span>
              </div>
              <p className="text-[11px] italic text-slate-500">
                The following clinical possibilities are considered based on patient-reported
                information. These are NOT confirmed diagnoses.
              </p>

              <div className="space-y-3">
                {summary.clinicalConsiderations.map((cons, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white text-[11px] font-bold">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <p className="font-bold text-slate-900 text-sm">{cons.name}</p>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        Preliminary Consideration
                      </span>
                    </div>

                    {cons.clinicalNote && (
                      <p className="text-slate-700 italic leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {cons.clinicalNote}
                      </p>
                    )}

                    {cons.supportingFeatures.length > 0 && (
                      <div>
                        <p className="font-bold text-slate-700 mb-1 text-[11px]">
                          Supporting Features:
                        </p>
                        <ul className="space-y-1">
                          {cons.supportingFeatures.map((sf, i) => (
                            <li
                              key={i}
                              className="text-slate-700 flex items-start gap-1.5"
                            >
                              <span className="text-teal-600 font-bold shrink-0">•</span>
                              <span>{sf}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cons.uncertaintyNotes.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <p className="font-bold text-slate-500 mb-1 text-[11px]">
                          Diagnostic Uncertainty & Verification Needed:
                        </p>
                        <ul className="space-y-1">
                          {cons.uncertaintyNotes.map((un, i) => (
                            <li
                              key={i}
                              className="text-slate-500 flex items-start gap-1.5"
                            >
                              <span className="shrink-0 text-slate-400">–</span>
                              <span>{un}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Clinician Encounter & Handoff Note (SBAR / SOAP) */}
          {summary.drNote && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-slate-800 rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Clinical Encounter Note & Handoff (SBAR)
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  Healthcare Provider Briefing
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 text-xs">
                {parsedNote && parsedNote.sections.length > 0 ? (
                  <div className="space-y-3.5">
                    {parsedNote.sections.map((sec, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${
                          sec.category === "complaint"
                            ? "bg-slate-50 border-slate-200"
                            : sec.category === "urgency"
                            ? "bg-teal-50/70 border-teal-200 text-teal-950"
                            : sec.category === "safety"
                            ? "bg-amber-50/60 border-amber-200 text-amber-900 italic text-[11px]"
                            : "bg-white border-slate-100"
                        }`}
                      >
                        <p
                          className={`font-bold uppercase tracking-wider text-[10px] mb-1 ${
                            sec.category === "urgency"
                              ? "text-teal-800"
                              : sec.category === "safety"
                              ? "text-amber-800"
                              : "text-slate-500"
                          }`}
                        >
                          {sec.label}
                        </p>

                        {sec.bullets && sec.bullets.length > 0 ? (
                          <ul className="space-y-1 mt-1">
                            {sec.bullets.map((b, bi) => (
                              <li
                                key={bi}
                                className="flex items-start gap-1.5 text-slate-800"
                              >
                                <span
                                  className={
                                    sec.category === "positives"
                                      ? "text-teal-600 font-bold"
                                      : sec.category === "negatives"
                                      ? "text-slate-400 font-bold"
                                      : "text-slate-500"
                                  }
                                >
                                  {sec.category === "positives"
                                    ? "+"
                                    : sec.category === "negatives"
                                    ? "–"
                                    : "•"}
                                </span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                            {sec.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                    {summary.drNote}
                  </p>
                )}

                <p className="text-[10px] italic text-slate-400 pt-2 border-t border-slate-100">
                  AI-generated clinical encounter note synthesized from patient conversation.
                  Requires independent verification by a qualified healthcare professional.
                </p>
              </div>
            </section>
          )}

          {/* Information Gaps & Assessment Limitations - Only if not already present in SBAR */}
          {!summary.drNote && (summary.informationGaps?.length || summary.assessmentLimitations?.length) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {summary.informationGaps && summary.informationGaps.length > 0 && (
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-2">
                  <p className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                    Clinical Information Gaps
                  </p>
                  <ul className="space-y-1">
                    {summary.informationGaps.map((gap, idx) => (
                      <li key={idx} className="text-slate-700 flex items-start gap-1.5">
                        <span className="text-slate-400 font-bold">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.assessmentLimitations && summary.assessmentLimitations.length > 0 && (
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-2">
                  <p className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                    Assessment Limitations
                  </p>
                  <ul className="space-y-1">
                    {summary.assessmentLimitations.map((lim, idx) => (
                      <li key={idx} className="text-slate-600 flex items-start gap-1.5">
                        <span className="text-slate-400">–</span>
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Care & Self-Management Guidance */}
          {summary.guidance && summary.guidance.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3.5 bg-emerald-600 rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Care & Self-Management Guidance
                </h3>
              </div>
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-2.5">
                {summary.guidance.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-slate-800">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Medication Discussion (Only valid non-empty items) */}
          {summary.medicationDiscussion &&
            summary.medicationDiscussion.filter(
              (m) =>
                m &&
                typeof m.medication === "string" &&
                m.medication.trim().length > 1 &&
                m.medication.trim().toLowerCase() !== "undefined"
            ).length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-teal-600 rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Medication Discussion
                  </h3>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-2 text-xs">
                  {summary.medicationDiscussion
                    .filter(
                      (m) =>
                        m &&
                        typeof m.medication === "string" &&
                        m.medication.trim().length > 1 &&
                        m.medication.trim().toLowerCase() !== "undefined"
                    )
                    .map((med, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-800">
                        <span className="text-teal-600 font-bold">•</span>
                        <span>
                          <strong className="text-slate-900">{med.medication}</strong>
                          {med.purpose && med.purpose !== "Not specified" && ` — Purpose: ${med.purpose}`}
                          {med.dose && med.dose !== "Not specified" && ` | Dose: ${med.dose}`}
                          {med.frequency && med.frequency !== "Not specified" && ` | Freq: ${med.frequency}`}
                        </span>
                      </div>
                    ))}
                </div>
              </section>
            )}

          {/* Red-Flag & Emergency Safety Warnings */}
          {summary.safetyWarnings && summary.safetyWarnings.length > 0 && (
            <section className="p-5 rounded-2xl border border-red-200 bg-red-50/70 space-y-3 shadow-sm text-red-950 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />
              <div className="flex items-center gap-2 text-red-800 pl-1">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Red-Flag & Emergency Safety Warnings
                </h3>
              </div>
              <p className="text-[11px] font-semibold text-red-800 pl-1">
                Seek immediate emergency medical evaluation if any of the following occur:
              </p>
              <ul className="space-y-1.5 pl-1">
                {summary.safetyWarnings.map((warn, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-red-900 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="font-bold text-red-600">!</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Follow-Up Plan */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-teal-600 rounded-full" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Follow-Up Plan
              </h3>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm text-xs space-y-2.5">
              {summary.followUp.recommendedMonitoring && (
                <p>
                  <span className="font-bold text-slate-700">Recommended Monitoring:</span>{" "}
                  <span className="text-slate-800">
                    {summary.followUp.recommendedMonitoring}
                  </span>
                </p>
              )}
              {summary.followUp.suggestedFollowUp && (
                <p>
                  <span className="font-bold text-slate-700">Suggested Follow-Up:</span>{" "}
                  <span className="text-slate-800">
                    {summary.followUp.suggestedFollowUp}
                  </span>
                </p>
              )}
              {summary.followUp.whenToSeekCare && (
                <p>
                  <span className="font-bold text-slate-700">When to Seek Care:</span>{" "}
                  <span className="text-slate-800">
                    {summary.followUp.whenToSeekCare}
                  </span>
                </p>
              )}
            </div>
          </section>

          {/* Legal Disclaimer Box */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 text-[11px] space-y-2 text-slate-500 shadow-sm">
            <p className="font-bold uppercase tracking-wider text-slate-700">
              Important Clinical & Legal Disclaimer
            </p>
            <p className="leading-relaxed">{summary.disclaimer}</p>
            <p className="font-semibold text-slate-600 pt-2 border-t border-slate-200">
              {summary.copyright ||
                "© 2026 Hippocrates AI Clinical Platform. All rights reserved."}{" "}
              • Document ID: {summary.documentId || "N/A"}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-border bg-card/95 backdrop-blur-md print:hidden">
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            Hippocrates AI Clinical Platform • Doc ID: {summary.documentId || "N/A"}
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-muted/60 hover:bg-muted text-foreground cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onDownloadPdf}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
