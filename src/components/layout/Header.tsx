"use client";

import Image from "next/image";
import { Menu, Stethoscope, HeartPulse, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/hooks/useAppContext";
import { useAuth } from "@/context/AuthContext";
import { UserMenu } from "@/components/auth/UserMenu";

export function Header() {
  const { toggleSidebar, persona, selectPersona } = useApp();
  const { doctorRegistrationNumber } = useAuth();

  const handleLogoClick = () => {
    if (persona) {
      selectPersona(persona);
    }
  };

  return (
    <header className="premium-hairline sticky top-0 z-[70] grid min-h-[68px] grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2 sm:px-4 sm:gap-3 lg:px-6 backdrop-blur-2xl bg-white/60">
      {/* Left — sidebar toggle + brand */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button
          variant="glass"
          size="icon-sm"
          className="shrink-0 rounded-xl"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </Button>

        <button
          onClick={handleLogoClick}
          aria-label="Hippocrates home"
          className="group flex min-w-0 items-center gap-2.5 transition-opacity duration-200 hover:opacity-90 text-left select-none cursor-pointer"
        >
          <div className="relative shrink-0 flex items-center justify-center">
            <Image
              src="/logo.jpg"
              alt="Hippocrates Logo"
              width={48}
              height={32}
              className="h-7 sm:h-8 w-auto object-contain select-none rounded-md"
              priority
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="text-base font-semibold tracking-tight text-slate-900 font-sans">
              Hippocrates
            </span>
            <span className="text-[7px] font-medium uppercase tracking-[0.22em] text-slate-400 mt-1 font-sans">
              AI CLINICAL PLATFORM
            </span>
          </div>
        </button>

        {persona && (
          <div className="hidden md:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100/90 text-slate-800 border border-slate-200/80">
            {persona === "doctor" ? (
              <>
                <Stethoscope className="h-3.5 w-3.5 text-hippo-navy" />
                <span>Doctor Mode • Oracle</span>
                {doctorRegistrationNumber && (
                  <span className="inline-flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-300 text-[10px] text-emerald-700 font-mono font-semibold">
                    <BadgeCheck className="h-3 w-3 text-emerald-600" />
                    <span>#{doctorRegistrationNumber}</span>
                  </span>
                )}
              </>
            ) : (
              <>
                <HeartPulse className="h-3.5 w-3.5 text-hippo-blue" />
                <span>Patient Mode • Aegis</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center — empty spacer */}
      <div aria-hidden />

      {/* Right — User Account Menu (100% separated) */}
      <div className="flex items-center gap-2 sm:gap-3">
        <UserMenu />
      </div>
    </header>
  );
}
