"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { UserPersona } from "@/lib/types";
import { resolveApiUrl } from "@/lib/api-client";
import { Capacitor } from "@capacitor/core";
import {
  normalizePhoneNumber,
  isValidPhoneNumber,
  phoneToInternalEmail,
  getPhoneAliasCandidates,
  sanitizeAuthError,
} from "@/lib/auth/phoneUtils";

export interface SignUpOptions {
  email?: string;
  phone?: string;
  password: string;
  fullName: string;
  role: UserPersona;
  doctorRegistrationNumber?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  role: UserPersona | null;
  isPatientAccount: boolean;
  doctorRegistrationNumber: string | null;
  isDoctorVerified: boolean;
  authModalOpen: boolean;
  authModalPersona: UserPersona;
  authModalMode: "signin" | "signup";
  doctorOnboardingOpen: boolean;
  roleRestrictedModalOpen: boolean;
  openAuthModal: (persona?: UserPersona, mode?: "signin" | "signup") => void;
  closeAuthModal: () => void;
  setAuthModalPersona: (persona: UserPersona) => void;
  setAuthModalMode: (mode: "signin" | "signup") => void;
  setDoctorOnboardingOpen: (open: boolean) => void;
  setRoleRestrictedModalOpen: (open: boolean) => void;
  signInWithGoogle: (persona: UserPersona) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (options: SignUpOptions) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPhone: (options: SignUpOptions) => Promise<{ error: Error | null }>;
  updateDoctorRegistration: (registrationNumber: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalPersona, setAuthModalPersona] = useState<UserPersona>("patient");
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [doctorOnboardingOpen, setDoctorOnboardingOpen] = useState(false);
  const [roleRestrictedModalOpen, setRoleRestrictedModalOpen] = useState(false);

  // Doctor registration number
  const [doctorRegistrationNumber, setDoctorRegistrationNumber] = useState<string | null>(null);

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  // Strict role isolation: An account registered as a patient is permanently locked to patient role
  const isPatientAccount = useMemo(() => {
    return user?.user_metadata?.role === "patient";
  }, [user]);

  // Compute active role: strictly locked for patient accounts
  const role: UserPersona | null = useMemo(() => {
    if (isPatientAccount) return "patient";
    if (user?.user_metadata?.role === "doctor") return "doctor";
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hippocrates_persona");
      if (saved === "doctor" || saved === "patient") return saved;
    }
    return null;
  }, [user, isPatientAccount]);

  // Doctor is verified if registration number is present and NOT a patient account
  const isDoctorVerified = useMemo(() => {
    if (isPatientAccount) return false;
    return Boolean(doctorRegistrationNumber && doctorRegistrationNumber.trim().length > 0);
  }, [doctorRegistrationNumber, isPatientAccount]);

  // Synchronize doctor registration number from user metadata or localStorage
  const syncDoctorRegistration = useCallback((currentUser: User | null) => {
    if (!currentUser || currentUser.user_metadata?.role === "patient") {
      setDoctorRegistrationNumber(null);
      return;
    }

    const regFromMeta = currentUser.user_metadata?.doctor_registration_number as string | undefined;
    if (regFromMeta && regFromMeta.trim().length > 0) {
      setDoctorRegistrationNumber(regFromMeta.trim());
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`hippocrates_dr_reg_${currentUser.id}`, regFromMeta.trim());
        } catch {
          // ignore
        }
      }
      return;
    }

    // Fallback to local storage if user previously entered it
    if (typeof window !== "undefined") {
      try {
        const localReg = localStorage.getItem(`hippocrates_dr_reg_${currentUser.id}`);
        if (localReg && localReg.trim().length > 0) {
          setDoctorRegistrationNumber(localReg.trim());
          return;
        }
      } catch {
        // ignore
      }
    }

    setDoctorRegistrationNumber(null);
  }, []);

  // Synchronize authenticated user profile to public.profiles table in real-time
  const syncUserProfile = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser || !supabase) return;
      try {
        const meta = currentUser.user_metadata || {};
        const role = meta.role === "doctor" ? "doctor" : "patient";
        const regNo = (meta.doctor_registration_number as string | undefined)?.trim() || null;
        const fullName =
          (meta.full_name as string | undefined)?.trim() ||
          (meta.name as string | undefined)?.trim() ||
          (currentUser.email ? currentUser.email.split("@")[0] : "User");
        const phone = currentUser.phone || (meta.phone as string | undefined) || null;

        await supabase.from("profiles").upsert(
          {
            id: currentUser.id,
            email: currentUser.email || null,
            phone,
            full_name: fullName,
            role,
            doctor_registration_number: regNo,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch {
        // Non-blocking background sync
      }
    },
    [supabase]
  );

  // WebKit / Safari security fix: Automatically redirect from 0.0.0.0 to localhost
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname === "0.0.0.0") {
      const safeUrl = window.location.href.replace("//0.0.0.0", "//localhost");
      window.location.replace(safeUrl);
    }
  }, []);

  // Check URL params for OAuth role restriction signals
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("role_restriction") === "patient_cannot_be_doctor") {
        setRoleRestrictedModalOpen(true);
        params.delete("role_restriction");
        const cleanQuery = params.toString();
        const newUrl = window.location.pathname + (cleanQuery ? `?${cleanQuery}` : "");
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  // Initial session check and Supabase auth listener
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);
      syncDoctorRegistration(currentUser);
      if (currentUser) void syncUserProfile(currentUser);
      setIsLoading(false);

      if (currentUser?.user_metadata?.role === "patient") {
        // Strict clinical isolation: purge any accidental doctor persona flags
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("hippocrates_pending_role");
            localStorage.setItem("hippocrates_persona", "patient");
          } catch {
            // ignore
          }
        }
      } else if (currentUser) {
        const targetPersona = (
          typeof window !== "undefined"
            ? (new URLSearchParams(window.location.search).get("persona") ||
                localStorage.getItem("hippocrates_persona") ||
                localStorage.getItem("hippocrates_pending_role"))
            : null
        ) as UserPersona | null;

        const isDr = targetPersona === "doctor" || currentUser.user_metadata?.role === "doctor";
        const hasReg =
          currentUser.user_metadata?.doctor_registration_number ||
          (typeof window !== "undefined" &&
            localStorage.getItem(`hippocrates_dr_reg_${currentUser.id}`));

        if (isDr && !hasReg) {
          setDoctorOnboardingOpen(true);
        }
      }
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);
      syncDoctorRegistration(currentUser);
      if (currentUser) void syncUserProfile(currentUser);
      setIsLoading(false);

      if (currentUser?.user_metadata?.role === "patient") {
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("hippocrates_pending_role");
            localStorage.setItem("hippocrates_persona", "patient");
          } catch {
            // ignore
          }
        }
      } else if (event === "SIGNED_IN" && currentUser) {
        const pendingRole = (
          typeof window !== "undefined"
            ? localStorage.getItem("hippocrates_pending_role") ||
              localStorage.getItem("hippocrates_persona")
            : null
        ) as UserPersona | null;

        const isDr = pendingRole === "doctor" || currentUser.user_metadata?.role === "doctor";
        const hasReg =
          currentUser.user_metadata?.doctor_registration_number ||
          (typeof window !== "undefined" &&
            localStorage.getItem(`hippocrates_dr_reg_${currentUser.id}`));

        if (isDr && !hasReg) {
          setDoctorOnboardingOpen(true);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, syncDoctorRegistration, syncUserProfile]);

  const openAuthModal = useCallback(
    (persona: UserPersona = "patient", mode: "signin" | "signup" = "signin") => {
      // If patient account attempts to open auth for doctor mode, intercept with restriction modal
      if (isPatientAccount && persona === "doctor") {
        setRoleRestrictedModalOpen(true);
        return;
      }
      setAuthModalPersona(persona);
      setAuthModalMode(mode);
      setAuthModalOpen(true);
    },
    [isPatientAccount]
  );

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  // Google OAuth sign-in / sign-up
  const signInWithGoogle = useCallback(
    async (persona: UserPersona) => {
      if (isPatientAccount && persona === "doctor") {
        setRoleRestrictedModalOpen(true);
        return {
          error: new Error("Under clinical isolation governance, an account registered as a patient cannot switch or register as a doctor."),
        };
      }

      if (!supabase) {
        return { error: new Error("Authentication service is currently unavailable.") };
      }

      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("hippocrates_pending_role", persona);
          localStorage.setItem("hippocrates_persona", persona);
        }

        let redirectTo: string;
        if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
          redirectTo = `ai.hippocrates.app://auth/callback?persona=${persona}&next=${encodeURIComponent("/")}`;
        } else {
          const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
          const rawOrigin = (typeof window !== "undefined" && window.location.origin && !window.location.origin.includes("0.0.0.0"))
            ? window.location.origin
            : (configuredSiteUrl || "http://localhost:3000");
          const origin = rawOrigin.replace(/\/$/, "").replace("0.0.0.0", "localhost");
          redirectTo = `${origin}/auth/callback?persona=${persona}&redirect_origin=${encodeURIComponent(origin)}&next=${encodeURIComponent("/")}`;
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

        if (error) {
          return { error };
        }

        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error("Failed to initialize Google authentication") };
      }
    },
    [supabase, isPatientAccount]
  );

  // Email & Password sign-in
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { error: new Error("Authentication service is currently unavailable.") };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { error };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          syncDoctorRegistration(data.user);
          void syncUserProfile(data.user);
        }

        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error("Failed to sign in") };
      }
    },
    [supabase, syncDoctorRegistration, syncUserProfile]
  );

  // Email & Password sign-up (including Doctor Registration Number lead sequence)
  const signUpWithEmail = useCallback(
    async ({ email, password, fullName, role, doctorRegistrationNumber }: SignUpOptions) => {
      if (isPatientAccount && role === "doctor") {
        setRoleRestrictedModalOpen(true);
        return {
          error: new Error("Under healthcare compliance regulations, a patient account cannot register as a doctor."),
        };
      }

      if (!supabase) {
        return { error: new Error("Authentication service is currently unavailable.") };
      }

      if (!email || !email.trim()) {
        return { error: new Error("Please enter a valid email address.") };
      }

      try {
        if (role === "doctor" && (!doctorRegistrationNumber || doctorRegistrationNumber.trim().length === 0)) {
          return { error: new Error("Doctor Registration Number is mandatory for medical practitioner registration.") };
        }

        const trimmedReg = doctorRegistrationNumber?.trim() || null;
        const cleanEmail = email.trim().toLowerCase();

        // Step 1: Attempt server auto-confirm signup (bypasses email verification if service key configured)
        try {
          const apiRes = await fetch(resolveApiUrl("/api/auth/signup"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: cleanEmail,
              password,
              fullName,
              role,
              doctorRegistrationNumber: trimmedReg,
            }),
          });
          const apiData = await apiRes.json().catch(() => ({}));
          if (apiRes.ok && apiData.ok && apiData.user) {
            // User auto-confirmed! Immediately sign in to establish active session with zero verification friction
            const loginRes = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (loginRes.data?.user) {
              setUser(loginRes.data.user);
              setSession(loginRes.data.session);
              if (trimmedReg) {
                setDoctorRegistrationNumber(trimmedReg);
                try {
                  localStorage.setItem(`hippocrates_dr_reg_${loginRes.data.user.id}`, trimmedReg);
                  localStorage.setItem("hippocrates_persona", "doctor");
                } catch {}
              }
              void syncUserProfile(loginRes.data.user);
              return { error: null };
            }
          } else if (apiData.error && !apiData.fallbackToClient) {
            return { error: new Error(apiData.error) };
          }
        } catch {
          // Fall through to client signup
        }

        // Step 2: Client-side signup fallback
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
              doctor_registration_number: trimmedReg,
            },
          },
        });

        if (error) {
          const errLower = (error.message || "").toLowerCase();
          if (
            errLower.includes("already registered") ||
            errLower.includes("already exists") ||
            errLower.includes("user already") ||
            errLower.includes("email already")
          ) {
            return {
              error: new Error("An account with this email address is already registered. Please log in instead."),
            };
          }
          if (
            error.status === 429 ||
            errLower.includes("rate limit") ||
            errLower.includes("security purposes")
          ) {
            return {
              error: new Error(
                "Supabase email verification rate limit reached. To enable instant signup without limits, please disable 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email) or add SUPABASE_SERVICE_ROLE_KEY to .env.local."
              ),
            };
          }
          return { error };
        }

        // Supabase returns an empty identities array when an account with that email already exists
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          return {
            error: new Error("An account with this email address is already registered. Please log in instead."),
          };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          if (trimmedReg) {
            setDoctorRegistrationNumber(trimmedReg);
            try {
              localStorage.setItem(`hippocrates_dr_reg_${data.user.id}`, trimmedReg);
              localStorage.setItem("hippocrates_persona", "doctor");
            } catch {
              // ignore
            }
          }
          void syncUserProfile(data.user);

          // If session was null (due to Supabase email confirmation requirement), try immediate sign-in
          if (!data.session) {
            const loginAttempt = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (loginAttempt.data?.session) {
              setSession(loginAttempt.data.session);
              setUser(loginAttempt.data.user);
              return { error: null };
            }
          }
        }

        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error("Failed to register account") };
      }
    },
    [supabase, isPatientAccount, syncUserProfile]
  );

  // Mobile Phone sign-in
  const signInWithPhone = useCallback(
    async (phone: string, password: string) => {
      if (!supabase) {
        return { error: new Error("Authentication service is currently unavailable.") };
      }

      if (!phone || !isValidPhoneNumber(phone)) {
        return { error: new Error("Please enter a valid mobile phone number.") };
      }

      const cleanPhone = normalizePhoneNumber(phone);
      const candidates = getPhoneAliasCandidates(cleanPhone);

      try {
        let authResult = null;
        let lastError: Error | { message?: string } | null = null;

        // Step 1: Try candidate internal aliases
        for (const aliasEmail of candidates) {
          const res = await supabase.auth.signInWithPassword({
            email: aliasEmail,
            password,
          });

          if (!res.error && res.data?.user) {
            authResult = res;
            break;
          } else if (res.error) {
            lastError = res.error;
          }
        }

        // Step 2: Try native phone sign-in if provider is ever enabled in future Supabase config
        if (!authResult) {
          try {
            const nativeRes = await supabase.auth.signInWithPassword({
              phone: cleanPhone,
              password,
            });
            if (!nativeRes.error && nativeRes.data?.user) {
              authResult = nativeRes;
            } else if (nativeRes.error) {
              const msg = (nativeRes.error.message || "").toLowerCase();
              if (!msg.includes("disabled") && !msg.includes("sms")) {
                lastError = nativeRes.error;
              }
            }
          } catch {
            // Ignore native failure
          }
        }

        if (!authResult || !authResult.data?.user) {
          return {
            error: new Error(
              sanitizeAuthError(lastError || "Invalid mobile phone number or password.", "signin")
            ),
          };
        }

        const currentUser = authResult.data.user;
        setUser(currentUser);
        setSession(authResult.data.session);
        syncDoctorRegistration(currentUser);
        void syncUserProfile(currentUser);

        return { error: null };
      } catch (err) {
        return {
          error: new Error(sanitizeAuthError(err instanceof Error ? err.message : "Failed to sign in", "signin")),
        };
      }
    },
    [supabase, syncDoctorRegistration, syncUserProfile]
  );

  // Mobile Phone sign-up (including Doctor Registration Number lead sequence)
  const signUpWithPhone = useCallback(
    async ({ phone, password, fullName, role, doctorRegistrationNumber }: SignUpOptions) => {
      if (isPatientAccount && role === "doctor") {
        setRoleRestrictedModalOpen(true);
        return {
          error: new Error("Under healthcare compliance regulations, a patient account cannot register as a doctor."),
        };
      }

      if (!supabase) {
        return { error: new Error("Authentication service is currently unavailable.") };
      }

      if (!phone || !isValidPhoneNumber(phone)) {
        return { error: new Error("Please enter a valid mobile phone number.") };
      }

      const cleanPhone = normalizePhoneNumber(phone);
      const aliasEmail = phoneToInternalEmail(cleanPhone);

      try {
        if (role === "doctor" && (!doctorRegistrationNumber || doctorRegistrationNumber.trim().length === 0)) {
          return { error: new Error("Doctor Registration Number is mandatory for medical practitioner registration.") };
        }

        const trimmedReg = doctorRegistrationNumber?.trim() || null;

        // Step 1: Server-side registration via /api/auth/signup (uses service role key to auto-confirm & sync profile)
        try {
          const apiRes = await fetch(resolveApiUrl("/api/auth/signup"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: cleanPhone,
              password,
              fullName,
              role,
              doctorRegistrationNumber: trimmedReg,
            }),
          });
          const apiData = await apiRes.json().catch(() => ({}));

          if (apiRes.ok && apiData.ok && apiData.user) {
            // User registered & auto-confirmed! Immediately sign in to establish active session
            const loginRes = await supabase.auth.signInWithPassword({
              email: aliasEmail,
              password,
            });

            if (loginRes.data?.user) {
              setUser(loginRes.data.user);
              setSession(loginRes.data.session);
              if (trimmedReg) {
                setDoctorRegistrationNumber(trimmedReg);
                try {
                  localStorage.setItem(`hippocrates_dr_reg_${loginRes.data.user.id}`, trimmedReg);
                  localStorage.setItem("hippocrates_persona", "doctor");
                } catch {}
              }
              void syncUserProfile(loginRes.data.user);
              return { error: null };
            }
          } else if (apiData.error && !apiData.fallbackToClient) {
            return { error: new Error(sanitizeAuthError(apiData.error, "signup")) };
          }
        } catch {
          // Fall through to client registration
        }

        // Step 2: Client-side registration using internal alias
        const result = await supabase.auth.signUp({
          email: aliasEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
              doctor_registration_number: trimmedReg,
              phone: cleanPhone,
            },
          },
        });

        if (result.error) {
          return { error: new Error(sanitizeAuthError(result.error, "signup")) };
        }

        // Supabase returns an empty identities array when a user with this alias already exists
        if (result.data?.user && Array.isArray(result.data.user.identities) && result.data.user.identities.length === 0) {
          return {
            error: new Error("An account with this mobile phone number is already registered. Please log in instead."),
          };
        }

        if (result.data?.user) {
          setUser(result.data.user);
          setSession(result.data.session);
          if (trimmedReg) {
            setDoctorRegistrationNumber(trimmedReg);
            try {
              localStorage.setItem(`hippocrates_dr_reg_${result.data.user.id}`, trimmedReg);
              localStorage.setItem("hippocrates_persona", "doctor");
            } catch {}
          }
          void syncUserProfile(result.data.user);

          // If session was null (due to Supabase email confirmation requirement), try immediate sign-in
          if (!result.data.session) {
            const loginAttempt = await supabase.auth.signInWithPassword({
              email: aliasEmail,
              password,
            });
            if (loginAttempt.data?.session) {
              setSession(loginAttempt.data.session);
              setUser(loginAttempt.data.user);
              return { error: null };
            }
          }
        }

        return { error: null };
      } catch (err) {
        return {
          error: new Error(sanitizeAuthError(err instanceof Error ? err.message : "Failed to register account with phone number", "signup")),
        };
      }
    },
    [supabase, isPatientAccount, syncUserProfile]
  );

  // Update or provide Doctor Registration Number (e.g. after Google OAuth or modal prompt)
  const updateDoctorRegistration = useCallback(
    async (regNumber: string) => {
      // STRICT IMMUTABILITY: An existing patient account can NEVER register as a doctor
      if (isPatientAccount) {
        setRoleRestrictedModalOpen(true);
        return {
          success: false,
          error: "Access Denied: Under healthcare clinical separation rules, an account registered as a Patient cannot register as a medical doctor. Please sign out and sign in with a verified medical practitioner account.",
        };
      }

      const trimmed = regNumber.trim();
      if (!trimmed || trimmed.length < 3) {
        return { success: false, error: "Please enter a valid Doctor Registration Number (minimum 3 characters)." };
      }

      try {
        if (user && supabase) {
          const { error } = await supabase.auth.updateUser({
            data: {
              doctor_registration_number: trimmed,
              role: "doctor",
            },
          });

          if (error) {
            return { success: false, error: error.message };
          }
        }

        // Update local state and storage
        setDoctorRegistrationNumber(trimmed);
        if (typeof window !== "undefined") {
          try {
            if (user) {
              localStorage.setItem(`hippocrates_dr_reg_${user.id}`, trimmed);
            }
            localStorage.setItem("hippocrates_persona", "doctor");
            localStorage.removeItem("hippocrates_pending_role");
          } catch {
            // ignore
          }
        }

        setDoctorOnboardingOpen(false);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to update registration number",
        };
      }
    },
    [user, supabase, isPatientAccount]
  );

  // Sign out
  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setDoctorRegistrationNumber(null);
    setDoctorOnboardingOpen(false);
    setRoleRestrictedModalOpen(false);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("hippocrates_pending_role");
        localStorage.removeItem("hippocrates_persona");
        localStorage.removeItem("aegis_active_consultation_id");
        // Clear all stored consultation histories to strictly isolate between users
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith("aegis_consultation_") ||
              key.startsWith("hippocrates_dr_reg_"))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {
        // ignore
      }
    }
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      role,
      isPatientAccount,
      doctorRegistrationNumber,
      isDoctorVerified,
      authModalOpen,
      authModalPersona,
      authModalMode,
      doctorOnboardingOpen,
      roleRestrictedModalOpen,
      openAuthModal,
      closeAuthModal,
      setAuthModalPersona,
      setAuthModalMode,
      setDoctorOnboardingOpen,
      setRoleRestrictedModalOpen,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInWithPhone,
      signUpWithPhone,
      updateDoctorRegistration,
      signOut,
    }),
    [
      user,
      session,
      isLoading,
      role,
      isPatientAccount,
      doctorRegistrationNumber,
      isDoctorVerified,
      authModalOpen,
      authModalPersona,
      authModalMode,
      doctorOnboardingOpen,
      roleRestrictedModalOpen,
      openAuthModal,
      closeAuthModal,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInWithPhone,
      signUpWithPhone,
      updateDoctorRegistration,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
