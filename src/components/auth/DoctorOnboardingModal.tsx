"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/hooks/useAppContext";
import {
  Stethoscope,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileBadge2,
  ArrowRight,
  HeartPulse,
  Lock,
} from "lucide-react";

export function DoctorOnboardingModal() {
  const {
    user,
    isPatientAccount,
    doctorOnboardingOpen,
    setDoctorOnboardingOpen,
    updateDoctorRegistration,
    signOut,
    openAuthModal,
  } = useAuth();
  const { selectPersona } = useApp();

  const [regNumber, setRegNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.email ? user.email.split("@")[0] : "Doctor");

  // Strict role isolation: If existing user is a patient account, NEVER show registration form
  if (isPatientAccount) {
    return (
      <Dialog open={doctorOnboardingOpen} onOpenChange={setDoctorOnboardingOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[460px] p-6 bg-white/98 backdrop-blur-2xl rounded-3xl border border-amber-200/90 shadow-2xl">
          <div className="space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20 shadow-xs">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Patient Account Cannot Register as Doctor</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Under healthcare governance and clinical isolation rules, an account registered as a Patient (<span className="font-semibold text-slate-800">{user?.email}</span>) cannot register as a medical doctor.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={() => {
                  setDoctorOnboardingOpen(false);
                  selectPersona("patient");
                }}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                Continue in Patient Mode (Aegis)
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  setDoctorOnboardingOpen(false);
                  await signOut();
                  openAuthModal("doctor", "signin");
                }}
                className="w-full py-4 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
              >
                Sign Out to Use Doctor Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = regNumber.trim();
    if (!trimmed || trimmed.length < 3) {
      setErrorMessage("Please enter a valid Doctor Registration Number (minimum 3 characters).");
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateDoctorRegistration(trimmed);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to save registration number. Please try again.");
      } else {
        selectPersona("doctor");
      }
    } catch {
      setErrorMessage("An unexpected error occurred while verifying your registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToPatient = () => {
    setDoctorOnboardingOpen(false);
    selectPersona("patient");
  };

  return (
    <Dialog
      open={doctorOnboardingOpen}
      onOpenChange={(open) => {
        if (!open) {
          setDoctorOnboardingOpen(false);
        }
      }}
    >
      <DialogContent className="w-[95vw] sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-0 bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-emerald-200/80 shadow-2xl">
        {/* Header Banner */}
        <div className="p-4 sm:p-6 pb-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <FileBadge2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Physician Licensure Requirement</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Clinical Protocol</span>
              </div>
            </div>

            <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 shrink-0" />
              <span>Doctor Registration Number</span>
            </DialogTitle>

            <DialogDescription className="text-xs text-slate-300 leading-relaxed">
              Welcome, <span className="font-semibold text-white">{displayName}</span>. Under Hippocrates clinical safety guidelines, all practitioners signing in via Google or email must verify their Medical Council Registration Number to unlock Oracle Clinical Copilot.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="onboarding-reg-no" className="text-xs font-bold text-slate-800">
                  Medical Registration / License Number *
                </Label>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Required
                </span>
              </div>
              <div className="relative">
                <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                <Input
                  id="onboarding-reg-no"
                  type="text"
                  placeholder="e.g. MCI-2019-94812 / NMC / State Council ID"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="pl-10 h-11 rounded-xl text-xs bg-slate-50 border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-emerald-500 font-mono tracking-wide"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-normal pt-1">
                This registration identifier will be permanently linked to your profile and stamped onto clinical assessments, SOAP notes, and differential summaries.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 py-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Licensure...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Enter Oracle</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleSwitchToPatient}
                className="w-full sm:w-auto text-xs text-slate-600 hover:text-slate-900 rounded-xl"
              >
                <HeartPulse className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                <span>Switch to Patient</span>
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
