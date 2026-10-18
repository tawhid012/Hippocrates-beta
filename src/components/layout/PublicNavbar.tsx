"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ArrowRight, Stethoscope, HeartPulse, Sparkles } from "lucide-react";
import { HippocratesLogo } from "@/components/landing/HippocratesLogo";
import { Button } from "@/components/ui/button";
import { GetStartedModal } from "@/components/landing/GetStartedModal";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/context/AuthContext";

interface PublicNavbarProps {
  onSelectPersona?: (persona: "doctor" | "patient") => void;
  onOpenGetStarted?: () => void;
}

export function PublicNavbar({
  onSelectPersona,
  onOpenGetStarted,
}: PublicNavbarProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [getStartedModalOpen, setGetStartedModalOpen] = useState(false);
  const { user, isPatientAccount, openAuthModal } = useAuth();
  const router = useRouter();

  const handleOpenLaunch = () => {
    if (user) {
      if (isPatientAccount) {
        if (onSelectPersona) {
          onSelectPersona("patient");
        } else {
          router.push("/?persona=patient");
        }
        return;
      }
      if (user.user_metadata?.role === "doctor") {
        if (onSelectPersona) {
          onSelectPersona("doctor");
        } else {
          router.push("/?persona=doctor");
        }
        return;
      }
    }
    if (onOpenGetStarted) {
      onOpenGetStarted();
    } else {
      openAuthModal("patient", "signup");
    }
  };

  const handleSelectPersona = (persona: "doctor" | "patient") => {
    const defaultModel = persona === "doctor" ? "oracle-core" : "aegis-core";
    try {
      localStorage.setItem("hippocrates_persona", persona);
      localStorage.setItem("hippocrates_model", defaultModel);
    } catch {
      // Ignore
    }

    if (onSelectPersona) {
      onSelectPersona(persona);
    } else {
      router.push(`/?persona=${persona}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-xl bg-white/85 border-b border-slate-200/60 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="hover:opacity-95 transition-opacity" aria-label="Hippocrates Home">
            <HippocratesLogo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8" aria-label="Main Navigation">
            <Link href="/platform" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Platform
            </Link>
            <Link href="/aegis" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Aegis
            </Link>
            <Link href="/oracle" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Oracle
            </Link>
            <Link href="/medical-reports" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Reports
            </Link>
            <Link href="/knowledge" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Knowledge
            </Link>
            <Link href="/safety" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Safety
            </Link>
            <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-2.5">
            <UserMenu />
            {!user && (
              <Button
                variant="ghost"
                onClick={() => openAuthModal("patient", "signin")}
                className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
              >
                Sign In
              </Button>
            )}
            <Button
              onClick={handleOpenLaunch}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-full px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>{user ? "Launch App" : "Get Started"}</span>
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            <UserMenu />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-800 hover:bg-slate-100 rounded-xl"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-20 z-40 bg-white/98 backdrop-blur-2xl lg:hidden overflow-y-auto px-6 py-8 border-t border-slate-100 flex flex-col justify-between animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="space-y-6">
              <nav className="flex flex-col space-y-3" aria-label="Mobile Navigation">
                <Link href="/platform" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-1.5 border-b border-slate-100">
                  Platform Architecture
                </Link>
                <Link href="/aegis" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-1.5 border-b border-slate-100">
                  Aegis (Patient Intelligence)
                </Link>
                <Link href="/oracle" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-1.5 border-b border-slate-100">
                  Oracle (Doctor Copilot)
                </Link>
                <Link href="/medical-reports" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-1.5 border-b border-slate-100">
                  Medical Report Guide
                </Link>
                <Link href="/knowledge" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-1.5 border-b border-slate-100">
                  Knowledge Hub
                </Link>
                <Link href="/safety" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-1.5 border-b border-slate-100">
                  Responsible AI &amp; Safety
                </Link>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-1.5 border-b border-slate-100">
                  About Hippocrates
                </Link>
                <Link href="/get-started" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-1.5 border-b border-slate-100">
                  Install App &amp; PWA
                </Link>
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-1.5 border-b border-slate-100">
                  Contact Support
                </Link>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                  <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
                    Terms
                  </Link>
                  <Link href="/disclaimer" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
                    Medical Disclaimer
                  </Link>
                </div>
              </nav>

              {/* Direct Workspace Launchers */}
              <div className="pt-2 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Launch Workspace</p>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSelectPersona("patient");
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-left hover:bg-blue-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <HeartPulse className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Talk to Aegis</div>
                      <div className="text-xs text-slate-500">Patient Health Consultation</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSelectPersona("doctor");
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200 text-left hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Try Oracle</div>
                      <div className="text-xs text-slate-500">Doctor Clinical Copilot</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-700" />
                </button>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {!user && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal("patient", "signin");
                    }}
                    className="w-full border-slate-200 hover:bg-slate-50 text-slate-800 py-3 rounded-2xl font-medium"
                  >
                    Sign In
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenLaunch();
                  }}
                  className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white py-4 rounded-2xl font-medium shadow-sm flex items-center justify-center gap-2"
                >
                  <span>{user ? "Launch Platform App" : "Get Started"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="pt-8 text-center text-xs text-slate-400">
              © 2026 Hippocrates AI Platform. All rights reserved.
            </div>
          </div>
        )}
      </header>

      {/* Built-in Get Started / Workspace Selector Modal */}
      <GetStartedModal
        open={getStartedModalOpen}
        onOpenChange={setGetStartedModalOpen}
        onSelectPersona={handleSelectPersona}
      />
    </>
  );
}

