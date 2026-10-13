"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { Stethoscope, HeartPulse, ArrowRight, ShieldCheck } from "lucide-react";

interface GetStartedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPersona: (persona: "doctor" | "patient") => void;
}

export function GetStartedModal({
  open,
  onOpenChange,
  onSelectPersona,
}: GetStartedModalProps) {
  const { user, isPatientAccount, isDoctorVerified, openAuthModal, setDoctorOnboardingOpen } = useAuth();

  // If already logged in, role is 100% determined: NEVER open selection menu
  useEffect(() => {
    if (open && user) {
      onOpenChange(false);
      if (isPatientAccount) {
        onSelectPersona("patient");
      } else if (user?.user_metadata?.role === "doctor") {
        onSelectPersona("doctor");
      }
    }
  }, [open, user, isPatientAccount, onOpenChange, onSelectPersona]);

  const handlePatientSelect = () => {
    onOpenChange(false);
    if (!user) {
      openAuthModal("patient", "signup");
    } else {
      onSelectPersona("patient");
    }
  };

  const handleDoctorSelect = () => {
    onOpenChange(false);
    if (!user) {
      openAuthModal("doctor", "signup");
    } else if (isPatientAccount) {
      // Patients cannot select doctor
      onSelectPersona("patient");
    } else if (!isDoctorVerified) {
      setDoctorOnboardingOpen(true);
    } else {
      onSelectPersona("doctor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-7 bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl">
        <DialogHeader className="text-center space-y-1.5 sm:space-y-2">
          <div className="mx-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            <span>AI Clinical Platform</span>
          </div>
          <DialogTitle className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How will you use Hippocrates?
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
            Choose your persona to launch the specialized clinical workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 pt-3 sm:pt-4">
          {/* Patient Card (Aegis) */}
          <div
            onClick={handlePatientSelect}
            className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer text-left"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <HeartPulse className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-slate-900">Patient Mode</h3>
                  <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Aegis
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Understand lab reports, decode symptoms, and prepare for doctor visits with plain-language AI.
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
              <span>Enter Aegis</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Doctor Card (Oracle) */}
          <div
            onClick={handleDoctorSelect}
            className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-lg transition-all duration-200 cursor-pointer text-left"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-slate-900">Doctor Mode</h3>
                  <span className="text-[10px] font-semibold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Oracle
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Clinical differential diagnosis, evidence-based citations, and medical research synthesis.
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:translate-x-0.5 transition-transform">
              <span className="text-slate-700">Physician Verification</span>
              <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Clinical data isolation & HIPAA compliant encryption</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
