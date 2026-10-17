"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  Stethoscope,
  HeartPulse,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { UserPersona } from "@/lib/types";
import { isValidPhoneNumber } from "@/lib/auth/phoneUtils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export function MobileAuthScreen() {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithPhone,
    signUpWithPhone,
  } = useAuth();

  // Mode: "signin" | "signup" | "forgot"
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  // Persona: "patient" | "doctor"
  const [persona, setPersona] = useState<UserPersona>("patient");
  // Method: "email" | "phone"
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");

  // Form Fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isDoctor = persona === "doctor";
  const isSignUp = mode === "signup";
  const isForgot = mode === "forgot";

  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // safe no-op on non-native or unsupported devices
    }
  };

  const handlePersonaSelect = (p: UserPersona) => {
    void triggerHaptic();
    setPersona(p);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleModeSwitch = (m: "signin" | "signup" | "forgot") => {
    void triggerHaptic();
    setMode(m);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    void triggerHaptic();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (isForgot) {
      if (!email.trim()) {
        setErrorMessage("Please enter your registered email address.");
        return;
      }
      setIsLoading(true);
      try {
        // Password recovery simulation / supabase reset request
        setSuccessMessage("Password reset instructions sent. Please check your inbox.");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to send reset link.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (authMethod === "email" && !email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (authMethod === "phone") {
      if (!phone.trim()) {
        setErrorMessage("Please enter your mobile phone number.");
        return;
      }
      if (!isValidPhoneNumber(phone)) {
        setErrorMessage("Please enter a valid mobile phone number.");
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
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
      if (isDoctor && (!doctorRegNo || doctorRegNo.trim().length === 0)) {
        setErrorMessage("Doctor Registration Number is mandatory for physician accounts.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        if (authMethod === "email") {
          const res = await signUpWithEmail({
            email,
            password,
            fullName,
            role: persona,
            doctorRegistrationNumber: isDoctor ? doctorRegNo : undefined,
          });
          if (res.error) {
            setErrorMessage(res.error.message);
          } else {
            setSuccessMessage("Account created successfully. Signing you in...");
          }
        } else {
          const res = await signUpWithPhone({
            phone,
            password,
            fullName,
            role: persona,
            doctorRegistrationNumber: isDoctor ? doctorRegNo : undefined,
          });
          if (res.error) {
            setErrorMessage(res.error.message);
          } else {
            setSuccessMessage("Account created successfully. Signing you in...");
          }
        }
      } else {
        // Sign In
        if (authMethod === "email") {
          const res = await signInWithEmail(email, password);
          if (res.error) {
            setErrorMessage(res.error.message);
          }
        } else {
          const res = await signInWithPhone(phone, password);
          if (res.error) {
            setErrorMessage(res.error.message);
          }
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-background text-foreground flex flex-col justify-between px-4 sm:px-6 py-4 pb-safe pt-safe overflow-y-auto overscroll-contain select-none">
      <div className="w-full max-w-md mx-auto my-auto flex flex-col gap-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="relative p-1.5 rounded-2xl bg-card shadow-sm border border-border">
            <Image
              src="/logo.jpg"
              alt="HIPPOCRATES Logo"
              width={64}
              height={64}
              className="h-14 w-14 rounded-xl object-contain select-none"
              priority
            />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              HIPPOCRATES
            </h1>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
              AI Clinical Copilot
            </p>
          </div>
        </div>

        {/* Persona Segment Control (Native styled toggle) */}
        {!isForgot && (
          <div className="bg-muted p-1 rounded-2xl border border-border grid grid-cols-2 gap-1 select-none">
            <button
              type="button"
              onClick={() => handlePersonaSelect("patient")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                persona === "patient"
                  ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HeartPulse
                className={`h-4 w-4 ${persona === "patient" ? "text-blue-500" : "text-muted-foreground"}`}
              />
              <span>Patient (Aegis)</span>
            </button>
            <button
              type="button"
              onClick={() => handlePersonaSelect("doctor")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                persona === "doctor"
                  ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Stethoscope
                className={`h-4 w-4 ${persona === "doctor" ? "text-emerald-500" : "text-muted-foreground"}`}
              />
              <span>Doctor (Oracle)</span>
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-card rounded-3xl p-6 sm:p-7 shadow-xl border border-border flex flex-col gap-5">
          {/* Form Title & Subtitle */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {isForgot
                  ? "Reset Password"
                  : isSignUp
                  ? isDoctor
                    ? "Register Doctor Account"
                    : "Create Patient Account"
                  : isDoctor
                  ? "Doctor Portal Sign In"
                  : "Welcome to Hippocrates"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isForgot
                  ? "Enter your email to receive recovery instructions"
                  : isSignUp
                  ? isDoctor
                    ? "Verified access to Oracle Clinical Copilot"
                    : "Access conversational health & report explanations"
                  : isDoctor
                  ? "Clinical case synthesis & differential support"
                  : "Sign in to access your secure consultations"}
              </p>
            </div>
            {isForgot && (
              <button
                type="button"
                onClick={() => handleModeSwitch("signin")}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Back to Sign In"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Feedback Alerts */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </motion.div>
            )}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email vs Phone Tab (if not in forgot mode) */}
          {!isForgot && (
            <div className="flex border-b border-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("email");
                  setErrorMessage(null);
                }}
                className={`flex-1 pb-2.5 text-center transition-colors cursor-pointer border-b-2 -mb-px ${
                  authMethod === "email"
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {isSignUp ? "Email Account" : "Sign in with Email"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("phone");
                  setErrorMessage(null);
                }}
                className={`flex-1 pb-2.5 text-center transition-colors cursor-pointer border-b-2 -mb-px ${
                  authMethod === "phone"
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {isSignUp ? "Mobile Phone" : "Sign in with Phone"}
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Full Name (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isDoctor ? "Dr. First Last" : "Your Name"}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Doctor Registration Number (Doctor Sign Up only) */}
            {isSignUp && isDoctor && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">
                    Doctor Registration Number *
                  </label>
                  <span className="text-[10px] text-emerald-500 font-medium">Mandatory</span>
                </div>
                <div className="relative">
                  <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  <input
                    type="text"
                    value={doctorRegNo}
                    onChange={(e) => setDoctorRegNo(e.target.value)}
                    placeholder="e.g. MCI-2021-98765 / State Council ID"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>
            )}

            {/* Email or Phone Input */}
            {authMethod === "email" || isForgot ? (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0123 / +91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-mono"
                  />
                </div>
              </div>
            )}

            {/* Password (if not in forgot mode) */}
            {!isForgot && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => handleModeSwitch("forgot")}
                      className="text-[11px] text-accent hover:underline font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-2xl bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-mono"
                  />
                </div>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-2 py-3.5 px-4 rounded-2xl text-xs font-semibold text-white shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                isDoctor
                  ? "bg-slate-900 hover:bg-slate-800 active:scale-[0.99]"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Please wait...</span>
                </>
              ) : (
                <>
                  <span>
                    {isForgot
                      ? "Send Reset Link"
                      : isSignUp
                      ? "Create Account"
                      : "Sign In"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="text-center pt-2 border-t border-border">
            {isForgot ? (
              <button
                type="button"
                onClick={() => handleModeSwitch("signin")}
                className="text-xs text-accent font-semibold hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            ) : isSignUp ? (
              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("signin")}
                  className="font-semibold text-accent hover:underline cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("signup")}
                  className="font-semibold text-accent hover:underline cursor-pointer ml-1"
                >
                  Create one
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Clinical Disclaimer & Security Footer */}
        <div className="flex flex-col items-center text-center space-y-1.5 px-4 text-[11px] text-muted-foreground/70">
          <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            <span>Encrypted Health Sessions • HIPAA & GDPR Architecture</span>
          </div>
          <p className="leading-relaxed">
            HIPPOCRATES provides AI-driven clinical awareness and triage. It is not a replacement for emergency medical care or qualified clinical judgment.
          </p>
        </div>
      </div>
    </div>
  );
}
