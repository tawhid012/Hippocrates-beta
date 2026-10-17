"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  Smartphone,
  User,
  HeartPulse,
  BadgeCheck,
  FileBadge,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/hooks/useAppContext";
import { formatUserIdentifier } from "@/lib/auth/phoneUtils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, toggleTheme, setTheme } = useTheme();
  const {
    user,
    isPatientAccount,
    doctorRegistrationNumber,
    isDoctorVerified,
    signOut,
    setDoctorOnboardingOpen,
  } = useAuth();
  const { persona } = useApp();

  const triggerHaptic = () => {
    try {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {}
  };

  const identifier = formatUserIdentifier(user);
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ||
    identifier ||
    (persona === "doctor" ? "Doctor" : "Patient");

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined);

  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "H";

  const isCurrentDoctor = persona === "doctor" || user?.user_metadata?.role === "doctor";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-card border-border text-foreground p-5 sm:p-6 rounded-3xl shadow-2xl">
        <DialogHeader className="text-left pb-1">
          <DialogTitle className="text-lg font-bold text-foreground">
            Profile & Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Manage your account, appearance, and clinical preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center gap-3.5">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover border border-border shadow-xs"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              ) : (
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold shadow-xs ${
                    isCurrentDoctor
                      ? "bg-slate-900 dark:bg-slate-800 text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {initials || <User className="h-5 w-5" />}
                </div>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                  isPatientAccount
                    ? "bg-blue-500"
                    : isDoctorVerified
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-foreground truncate leading-tight">
                {fullName}
              </h3>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-mono">
                {identifier}
              </p>

              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                {isPatientAccount ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <HeartPulse className="h-3 w-3" />
                    <span>Patient (Aegis)</span>
                  </span>
                ) : isDoctorVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <BadgeCheck className="h-3 w-3" />
                    <span>Physician #{doctorRegistrationNumber || "Verified"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <FileBadge className="h-3 w-3" />
                    <span>Physician Account</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Theme & Appearance Section */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Appearance & Theme
            </Label>

            {/* Visual 3-Way Theme Switcher (Dark, Light, System) */}
            <div className="grid grid-cols-3 gap-2">
              {/* Dark Theme Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setTheme("dark");
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-[#111827] text-white border-blue-500 shadow-sm ring-1 ring-blue-500"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-[#090d16] border border-slate-700 flex items-center justify-center mb-1.5 text-blue-400">
                  <Moon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold">Dark OLED</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">High Contrast</span>
              </button>

              {/* Light Theme Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setTheme("light");
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-white text-slate-900 border-blue-500 shadow-sm ring-1 ring-blue-500"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center mb-1.5 text-amber-500">
                  <Sun className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold">Light Clean</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Clinical Crisp</span>
              </button>

              {/* System Theme Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setTheme("system");
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  theme === "system"
                    ? "bg-accent/15 text-accent border-accent shadow-sm ring-1 ring-accent"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center mb-1.5 text-foreground">
                  <Smartphone className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold">Auto System</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Matches OS</span>
              </button>
            </div>
          </div>

          {/* Preferences Card */}
          <Card className="border border-border shadow-xs bg-muted/40">
            <CardContent className="p-3.5 space-y-3.5">
              {/* Dark Mode Quick Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10">
                    <Moon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground cursor-pointer">
                      Dark Theme
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      {theme === "dark" ? "Enabled (OLED True Black)" : "Disabled (Light Mode)"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={() => {
                    triggerHaptic();
                    toggleTheme();
                  }}
                  aria-label="Toggle dark theme"
                />
              </div>

              <Separator className="bg-border" />

              {/* Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10">
                    <Bell className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground">
                      Notifications
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Case updates & triage reminders
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator className="bg-border" />

              {/* Audio Filter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground">
                      Voice Noise Filtering
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Web Audio 100Hz HVAC hum suppression
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Active
                </span>
              </div>

              <Separator className="bg-border" />

              {/* Language */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10">
                    <Globe className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Language</Label>
                    <p className="text-[11px] text-muted-foreground">English (Clinical US/UK)</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* HIPAA Compliance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Shield className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground">
                      HIPAA / GDPR Protection
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Isolated client session tokens
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Encrypted
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Licensure Action */}
          {!isPatientAccount && doctorRegistrationNumber && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onOpenChange(false);
                setDoctorOnboardingOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-xs font-medium text-foreground transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileBadge className="h-4 w-4 text-muted-foreground" />
                <span>Update Medical Council Licensure</span>
              </div>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                #{doctorRegistrationNumber}
              </span>
            </button>
          )}

          {/* Sign Out Button */}
          {user && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onOpenChange(false);
                void signOut();
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-destructive/10 hover:bg-destructive/15 text-destructive border border-destructive/20 text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out of Hippocrates</span>
            </button>
          )}

          <p className="text-[10px] text-center text-muted-foreground pt-1">
            Hippocrates AI Native App • Android Edition v1.0.0
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
