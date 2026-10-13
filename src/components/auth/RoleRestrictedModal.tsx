"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/hooks/useAppContext";
import {
  ShieldAlert,
  HeartPulse,
  LogOut,
  Lock,
  ShieldCheck,
} from "lucide-react";

export function RoleRestrictedModal() {
  const {
    user,
    roleRestrictedModalOpen,
    setRoleRestrictedModalOpen,
    signOut,
    openAuthModal,
  } = useAuth();
  const { selectPersona } = useApp();

  const handleContinueAsPatient = () => {
    selectPersona("patient");
    setRoleRestrictedModalOpen(false);
  };

  const handleSwitchToDoctorAccount = async () => {
    setRoleRestrictedModalOpen(false);
    await signOut();
    openAuthModal("doctor", "signin");
  };

  return (
    <Dialog open={roleRestrictedModalOpen} onOpenChange={setRoleRestrictedModalOpen}>
      <DialogContent className="w-[95vw] sm:max-w-[480px] p-0 bg-white/98 backdrop-blur-2xl rounded-3xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] overflow-hidden">
        {/* Google Security Header */}
        <div className="p-6 pb-5 bg-gradient-to-b from-amber-50/80 via-white to-white border-b border-slate-100">
          <DialogHeader className="text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                <Lock className="h-3.5 w-3.5 text-amber-700" />
                <span>Account Role Locked</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Google Identity</span>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-1">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                  Patient Account Cannot Register as Doctor
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  Healthcare Governance & Clinical Role Separation
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-4 space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Authenticated Account:</span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Patient Role
              </span>
            </div>
            <p className="font-semibold text-slate-900 truncate">{user?.email}</p>
          </div>

          <p>
            Under healthcare compliance regulations and Hippocrates clinical isolation rules, an account registered as a <strong className="text-slate-900 font-semibold">Patient</strong> cannot register as a medical doctor or access the Doctor Clinical Copilot (<span className="text-slate-900 font-medium">Oracle</span>).
          </p>

          <p className="text-slate-500">
            Personal health consultations and physician differential diagnoses are strictly quarantined into separate security partitions.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <Button
              type="button"
              onClick={handleContinueAsPatient}
              className="w-full sm:flex-1 py-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <HeartPulse className="h-4 w-4" />
              <span>Continue in Patient Mode</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleSwitchToDoctorAccount}
              className="w-full sm:w-auto py-5 rounded-full border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Use Doctor Account</span>
            </Button>
          </div>
        </div>

        {/* Google-style Footer */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Protected by Google Identity & OAuth 2.0</span>
          <span>HIPAA Compliant</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
