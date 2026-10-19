"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Smartphone,
  Users,
  Layers,
  BookOpen,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
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

  // Prevent background scrolling while mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Close menu on ESC key or desktop resize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
      <header className="sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-xl bg-white/90 border-b border-slate-200/60 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="hover:opacity-95 transition-opacity" aria-label="Hippocrates Home">
            <HippocratesLogo size="md" />
          </Link>

          {/* Desktop Navigation Links — Platform, App, Knowledge, Safety, About, Contact */}
          <nav
            suppressHydrationWarning
            className="hidden lg:flex items-center gap-7 xl:gap-9"
            aria-label="Main Navigation"
          >
            <Link href="/platform" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Platform
            </Link>
            <Link href="/get-started" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5">
              <span>App</span>
            </Link>
            <Link href="/knowledge" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Knowledge
            </Link>
            <Link href="/safety" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Safety
            </Link>
            <Link href="/about" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
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
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu — Clean, focused platform navigation */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="fixed inset-x-0 top-20 bottom-0 z-40 bg-white lg:hidden overflow-y-auto overscroll-contain border-t border-slate-200/80 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ height: "calc(100dvh - 5rem)", WebkitOverflowScrolling: "touch" }}
        >
          <div className="max-w-md mx-auto px-6 py-6 flex flex-col justify-between min-h-full gap-6">
            <div className="space-y-4">
              <nav className="flex flex-col space-y-2" aria-label="Mobile Navigation">
                <Link
                  href="/platform"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all text-slate-800 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Platform</div>
                      <div className="text-xs text-slate-500">Dual-engine clinical architecture</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/get-started"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-100/70 transition-all text-slate-800 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Get the App</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                          Android APK
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">Download standalone mobile app</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/knowledge"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all text-slate-800 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Knowledge Hub</div>
                      <div className="text-xs text-slate-500">Blood tests &amp; medical guides</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/safety"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all text-slate-800 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Responsible AI</div>
                      <div className="text-xs text-slate-500">Clinical safety &amp; data privacy</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all text-slate-800 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">About Us</div>
                      <div className="text-xs text-slate-500">Founders &amp; mission</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all text-slate-800 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Contact</div>
                      <div className="text-xs text-slate-500">Support &amp; partnerships</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </nav>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2.5">
                {!user && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal("patient", "signin");
                    }}
                    className="w-full border-slate-300 hover:bg-slate-50 text-slate-800 py-3.5 rounded-2xl font-semibold text-sm cursor-pointer"
                  >
                    Sign In
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenLaunch();
                  }}
                  className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white py-3.5 rounded-2xl font-semibold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span>{user ? "Launch App" : "Get Started"}</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            <div className="pt-6 pb-2 text-center text-xs text-slate-400 border-t border-slate-100">
              © 2026 Hippocrates AI Platform
            </div>
          </div>
        </div>
      )}

      {/* Built-in Get Started / Workspace Selector Modal */}
      <GetStartedModal
        open={getStartedModalOpen}
        onOpenChange={setGetStartedModalOpen}
        onSelectPersona={handleSelectPersona}
      />
    </>
  );
}

