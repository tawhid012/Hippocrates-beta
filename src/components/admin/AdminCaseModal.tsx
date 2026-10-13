"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HeartPulse,
  Stethoscope,
  Trash2,
  Calendar,
  AlertTriangle,
  Loader2,
  User,
  Bot,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminCaseModalProps {
  caseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaseDeleted?: (caseId: string) => void;
}

interface CaseDetails {
  id: string;
  title: string;
  workspace_type: "aegis" | "oracle";
  model: string;
  persona: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  metadata?: Record<string, unknown>;
  user?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    role: string;
    doctor_registration_number?: string | null;
  } | null;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    created_at: string;
    metadata?: Record<string, unknown>;
  }>;
}

export function AdminCaseModal({
  caseId,
  open,
  onOpenChange,
  onCaseDeleted,
}: AdminCaseModalProps) {
  const [caseData, setCaseData] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId || !open) {
      setCaseData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/cases/${caseId}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to load consultation details.");
        return json.case as CaseDetails;
      })
      .then((data) => {
        if (isMounted) setCaseData(data);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Error loading case.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [caseId, open]);

  const handleDelete = async () => {
    if (!caseId) return;
    if (!confirm("Are you sure you want to permanently delete this consultation case? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete case.");
      onCaseDeleted?.(caseId);
      onOpenChange(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete case.");
    } finally {
      setDeleting(false);
    }
  };

  const isAegis = caseData?.workspace_type === "aegis";
  const caseState = (caseData?.metadata?.case_state as Record<string, unknown> | undefined) || {};
  const assessmentStatus = (caseState.assessment_status as string) || (caseData?.metadata?.assessment_status as string) || "INCOMPLETE";
  const urgencyLevel = (caseState.urgency_level as string) || (caseData?.metadata?.urgency_level as string) || "ROUTINE";
  const hasEmergency = urgencyLevel === "EMERGENCY" || urgencyLevel === "URGENT";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white flex-shrink-0">
          <DialogHeader className="text-left space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1",
                    isAegis
                      ? "bg-blue-50 text-blue-700 border-blue-200/60"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200/60"
                  )}
                >
                  {isAegis ? <HeartPulse className="h-3 w-3" /> : <Stethoscope className="h-3 w-3" />}
                  {isAegis ? "Aegis (Patient Triage)" : "Oracle (Clinical Copilot)"}
                </Badge>

                {hasEmergency && (
                  <Badge variant="destructive" className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 bg-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {urgencyLevel}
                  </Badge>
                )}

                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-700 font-mono">
                  {caseData?.model || "core-model"}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting || loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs rounded-xl h-8 px-2.5 cursor-pointer"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                Purge Case
              </Button>
            </div>

            <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight line-clamp-1">
              {caseData?.title || "Consultation Inspection"}
            </DialogTitle>

            <DialogDescription className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-mono text-[11px]">ID: {caseId}</span>
              {caseData?.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(caseData.created_at).toLocaleString()}
                </span>
              )}
              {caseData?.user && (
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <User className="h-3 w-3" />
                  {caseData.user.full_name || caseData.user.email} ({caseData.user.role})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Quick Clinical State Banner */}
          {caseData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[9px] uppercase font-semibold">Assessment Status</span>
                <span className="font-semibold text-slate-800 truncate block">{assessmentStatus}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[9px] uppercase font-semibold">Urgency Level</span>
                <span className={cn("font-semibold truncate block", hasEmergency ? "text-red-600" : "text-slate-800")}>
                  {urgencyLevel}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[9px] uppercase font-semibold">Total Turns</span>
                <span className="font-semibold text-slate-800">{caseData.messages.length} messages</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[9px] uppercase font-semibold">Last Interaction</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {caseData.last_message_at ? new Date(caseData.last_message_at).toLocaleTimeString() : "N/A"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span>Decrypting consultation transcript...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {!loading && !error && caseData?.messages.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No message exchanges recorded in this session.
            </div>
          )}

          {!loading &&
            caseData?.messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const attachment = (msg.metadata?.attachment as { fileName?: string; mimeType?: string } | undefined);

              return (
                <div
                  key={msg.id || idx}
                  className={cn(
                    "flex gap-3 max-w-[85%] rounded-2xl p-4 shadow-xs text-xs leading-relaxed",
                    isUser
                      ? "ml-auto bg-blue-600 text-white rounded-tr-xs"
                      : "mr-auto bg-white border border-slate-200/80 text-slate-900 rounded-tl-xs"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {isUser ? (
                      <div className="h-6 w-6 rounded-full bg-blue-500/80 flex items-center justify-center text-white">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("font-semibold text-[11px]", isUser ? "text-blue-100" : "text-slate-600")}>
                        {isUser ? (caseData.user?.full_name || "Patient / User") : "Hippocrates Clinical Intelligence"}
                      </span>
                      <span className={cn("text-[10px]", isUser ? "text-blue-200/80" : "text-slate-400 font-mono")}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {attachment && (
                      <div className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono",
                        isUser ? "bg-blue-700/60 text-blue-100" : "bg-slate-100 text-slate-700"
                      )}>
                        <Paperclip className="h-3 w-3" />
                        <span className="truncate">{attachment.fileName || "Report Attachment"}</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
