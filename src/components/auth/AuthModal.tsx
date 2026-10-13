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
import type { UserPersona } from "@/lib/types";
import { isValidPhoneNumber } from "@/lib/auth/phoneUtils";
import {
  Stethoscope,
  HeartPulse,
  Lock,
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Phone,
} from "lucide-react";

export function AuthModal() {
  const {
    authModalOpen,
    closeAuthModal,
    authModalPersona,
    setAuthModalPersona,
    authModalMode,
    setAuthModalMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithPhone,
    signUpWithPhone,
  } = useAuth();

  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isDoctor = authModalPersona === "doctor";
  const isSignUp = authModalMode === "signup";

  const handlePersonaChange = (p: UserPersona) => {
    setAuthModalPersona(p);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleModeChange = (mode: "signin" | "signup") => {
    setAuthModalMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await signInWithGoogle(authModalPersona);
      if (res.error) {
        setErrorMessage(res.error.message || "Failed to initialize Google authentication.");
      }
    } catch {
      setErrorMessage("An unexpected error occurred with Google Sign In.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (authMethod === "email" && !email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (authMethod === "phone") {
      if (!phone.trim()) {
        setErrorMessage("Please enter your mobile phone number.");
        return;
      }
      if (!isValidPhoneNumber(phone.trim())) {
        setErrorMessage("Please enter a valid mobile number with country code (e.g. +1... or +91...).");
        return;
      }
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (isSignUp) {
      if (!fullName.trim()) {
        setErrorMessage("Please enter your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      if (isDoctor && (!doctorRegNo.trim() || doctorRegNo.trim().length < 3)) {
        setErrorMessage("Doctor Registration Number is required (minimum 3 characters).");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        let res: { error: Error | null };
        if (authMethod === "phone") {
          res = await signUpWithPhone({
            phone: phone.trim(),
            password,
            fullName: fullName.trim(),
            role: authModalPersona,
            doctorRegistrationNumber: isDoctor ? doctorRegNo.trim() : undefined,
          });
        } else {
          res = await signUpWithEmail({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
            role: authModalPersona,
            doctorRegistrationNumber: isDoctor ? doctorRegNo.trim() : undefined,
          });
        }

        if (res.error) {
          setErrorMessage(res.error.message);
        } else {
          setSuccessMessage(
            authMethod === "phone"
              ? "Account created and verified successfully!"
              : "Account created successfully! If email confirmation is required, please check your inbox."
          );
          setTimeout(() => {
            closeAuthModal();
          }, 1500);
        }
      } else {
        let res: { error: Error | null };
        if (authMethod === "phone") {
          res = await signInWithPhone(phone.trim(), password);
        } else {
          res = await signInWithEmail(email.trim(), password);
        }

        if (res.error) {
          setErrorMessage(res.error.message);
        } else {
          setSuccessMessage("Signed in successfully!");
          setTimeout(() => {
            closeAuthModal();
          }, 800);
        }
      }
    } catch {
      setErrorMessage("An unexpected authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="w-[95vw] sm:max-w-[460px] max-h-[90vh] overflow-y-auto p-0 bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl">
        {/* Top Header / Persona Selector */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Hippocrates Access Gate
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <ShieldCheck className="h-3 w-3 shrink-0" />
                <span>HIPAA Encrypted</span>
              </div>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {isDoctor
                ? "Physician access requires verified Medical Council Registration."
                : "Personalized clinical guidance & lab report understanding."}
            </DialogDescription>
          </DialogHeader>

          {/* Persona Switch Tabs */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-4 p-1 bg-slate-100/90 rounded-xl sm:rounded-2xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => handlePersonaChange("patient")}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                !isDoctor
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HeartPulse className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
              <span className="truncate">Patient (Aegis)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePersonaChange("doctor")}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isDoctor
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
              <span className="truncate">Doctor (Oracle)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 pt-4 space-y-4">
          {/* Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Google OAuth Button */}
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-4 sm:py-5 min-h-[44px] rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2.5 sm:gap-3 transition-all cursor-pointer group"
            >
              {/* Google multicolor G icon */}
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>
            {isDoctor && (
              <p className="text-[10px] text-slate-500 text-center mt-1.5 leading-tight">
                Note: Doctors logging in via Google must provide their Medical Registration Number.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2 sm:my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider absolute">
              or continue with email or mobile
            </span>
          </div>

          {/* Email vs Mobile Toggle Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("email");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                authMethod === "email"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("phone");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                authMethod === "phone"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
              <span>Mobile Phone</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-fullname" className="text-xs font-semibold text-slate-700">
                  Full Name {isDoctor && <span className="text-slate-400 font-normal">(with Dr. prefix)</span>}
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="auth-fullname"
                    type="text"
                    placeholder={isDoctor ? "Dr. Sarah Chen, MD" : "Jane Doe"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-10 rounded-xl text-xs bg-slate-50/60 border-slate-200 focus:bg-white"
                    required
                  />
                </div>
              </div>
            )}

            {/* DOCTOR REGISTRATION NUMBER — IN LEAD SEQUENCE */}
            {isSignUp && isDoctor && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-doctor-reg" className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Doctor Registration Number *</span>
                  </Label>
                  <span className="text-[10px] font-semibold uppercase text-emerald-800 bg-emerald-200/60 px-1.5 py-0.5 rounded">
                    Required
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="auth-doctor-reg"
                    type="text"
                    placeholder="e.g. MCI-2018-84920 / State Medical Council ID"
                    value={doctorRegNo}
                    onChange={(e) => setDoctorRegNo(e.target.value)}
                    className="h-10 rounded-xl text-xs bg-white border-emerald-300 focus:border-emerald-600 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[10px] text-emerald-800/80 leading-tight">
                  Mandatory for clinical decision support under Medical Council guidelines. Stamped on generated notes & consults.
                </p>
              </div>
            )}

            {/* Identifier input: Email vs Mobile Phone */}
            {authMethod === "email" ? (
              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-xs font-semibold text-slate-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="name@hospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 rounded-xl text-xs bg-slate-50/60 border-slate-200 focus:bg-white"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-phone" className="text-xs font-semibold text-slate-700">
                    Mobile Phone Number
                  </Label>
                  <span className="text-[10px] text-slate-400">with country code</span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="auth-phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000 or +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-10 rounded-xl text-xs bg-slate-50/60 border-slate-200 focus:bg-white font-mono"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Include country code (e.g. +1 for US/Canada, +91 for India, +44 for UK).
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="auth-password" className="text-xs font-semibold text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-10 rounded-xl text-xs bg-slate-50/60 border-slate-200 focus:bg-white"
                  required
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-confirm-password" className="text-xs font-semibold text-slate-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="auth-confirm-password"
                    type="password"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-10 rounded-xl text-xs bg-slate-50/60 border-slate-200 focus:bg-white"
                    required
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isDoctor
                  ? "bg-slate-900 hover:bg-slate-800 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isSignUp ? (
                isDoctor ? "Complete Doctor Registration" : "Create Patient Account"
              ) : authMethod === "phone" ? (
                "Sign In with Mobile"
              ) : (
                "Sign In with Email"
              )}
            </Button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="pt-2 text-center text-xs text-slate-500">
            {isSignUp ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeChange("signin")}
                  className="font-semibold text-slate-900 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeChange("signup")}
                  className="font-semibold text-slate-900 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
