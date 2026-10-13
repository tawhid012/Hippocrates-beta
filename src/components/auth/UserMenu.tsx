"use client";

import React from "react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/hooks/useAppContext";
import {
  User,
  LogOut,
  HeartPulse,
  BadgeCheck,
  FileBadge,
  ShieldCheck,
} from "lucide-react";

export function UserMenu() {
  const {
    user,
    isPatientAccount,
    doctorRegistrationNumber,
    isDoctorVerified,
    signOut,
    setDoctorOnboardingOpen,
  } = useAuth();

  const { persona } = useApp();

  if (!user) {
    return null;
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.email ? user.email.split("@")[0] : "User");

  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined);

  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isCurrentDoctor = persona === "doctor" || user.user_metadata?.role === "doctor";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100/90 border border-slate-200/90 transition-all duration-150 cursor-pointer text-left focus:outline-hidden group shadow-2xs hover:shadow-xs"
          aria-label="Google Account Menu"
        >
          {/* Avatar Icon */}
          <div className="relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover border border-slate-200 shadow-2xs"
                referrerPolicy="no-referrer"
                unoptimized
              />
            ) : (
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shadow-2xs ${
                  isCurrentDoctor
                    ? "bg-slate-900 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {initials || <User className="h-3.5 w-3.5" />}
              </div>
            )}
            {/* Status dot */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                isPatientAccount
                  ? "bg-blue-500"
                  : isDoctorVerified
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
            />
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 leading-tight max-w-[125px] truncate">
              {fullName}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight flex items-center gap-1 font-sans">
              {isPatientAccount ? (
                <span className="text-blue-600 font-medium">Patient</span>
              ) : isCurrentDoctor ? (
                <>
                  <span className="text-emerald-600 font-medium">Doctor</span>
                  {isDoctorVerified && (
                    <BadgeCheck className="h-3 w-3 text-emerald-500 inline" />
                  )}
                </>
              ) : (
                <span className="text-blue-600 font-medium">Patient</span>
              )}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-76 p-0 bg-white/98 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.18)] overflow-hidden"
      >
        {/* Google-style Profile Header */}
        <div className="p-5 pb-4 bg-gradient-to-b from-slate-50/90 via-slate-50/40 to-white border-b border-slate-100 text-center">
          <div className="relative inline-block mx-auto mb-2.5">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
                width={52}
                height={52}
                className="h-13 w-13 rounded-full object-cover border-2 border-white shadow-md mx-auto"
                referrerPolicy="no-referrer"
                unoptimized
              />
            ) : (
              <div
                className={`h-13 w-13 rounded-full flex items-center justify-center text-lg font-bold shadow-md mx-auto ${
                  isCurrentDoctor
                    ? "bg-slate-900 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {initials || <User className="h-6 w-6" />}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white shadow-xs flex items-center justify-center border border-slate-200">
              {/* Google G icon */}
              <svg className="h-3 w-3" viewBox="0 0 24 24">
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
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate px-2">
            {fullName}
          </h3>
          <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5 px-2">
            {user.email}
          </p>

          {/* Account Role Badge — 100% separated */}
          <div className="mt-3 flex items-center justify-center">
            {isPatientAccount ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                <HeartPulse className="h-3 w-3 text-blue-600" />
                <span>Patient Account • Aegis Healthcare</span>
              </span>
            ) : isDoctorVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                <BadgeCheck className="h-3 w-3 text-emerald-600" />
                <span>Verified Physician • Oracle Copilot</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                <FileBadge className="h-3 w-3 text-amber-600" />
                <span>Physician (Unverified)</span>
              </span>
            )}
          </div>

          {/* Doctor Registration Number Display (Physicians only) */}
          {doctorRegistrationNumber && !isPatientAccount && (
            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-[11px] flex items-center justify-between">
              <span className="text-slate-500 font-medium">Council Licensure:</span>
              <span className="font-mono font-bold text-emerald-800">
                #{doctorRegistrationNumber}
              </span>
            </div>
          )}
        </div>

        {/* Doctor-only actions (updating licensure) — zero cross-role options for patients */}
        {!isPatientAccount && doctorRegistrationNumber && (
          <div className="p-2 pb-0">
            <DropdownMenuItem
              onClick={() => setDoctorOnboardingOpen(true)}
              className="text-xs py-2 px-3 rounded-xl cursor-pointer flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <FileBadge className="h-4 w-4 text-slate-500" />
              <span>Update Medical Council ID</span>
            </DropdownMenuItem>
          </div>
        )}

        <DropdownMenuSeparator className="my-1 border-slate-100" />

        {/* Security & Sign Out Section */}
        <div className="p-2 space-y-2">
          {/* HIPAA & Google Security notice */}
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2 text-[10px] text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="leading-tight">
              Protected by Google Identity & HIPAA Compliant Session Isolation
            </span>
          </div>

          {/* Google-style Pill Sign Out */}
          <DropdownMenuItem
            onClick={signOut}
            className="text-xs py-2.5 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 font-semibold text-red-600 bg-red-50/50 hover:bg-red-100/70 focus:bg-red-100/70 focus:text-red-700 border border-red-100 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out of Hippocrates</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
