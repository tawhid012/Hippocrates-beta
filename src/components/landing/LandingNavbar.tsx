"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Stethoscope, HeartPulse } from "lucide-react";
import { HippocratesLogo } from "./HippocratesLogo";
import { Button } from "@/components/ui/button";

interface LandingNavbarProps {
  onSelectPersona: (persona: "doctor" | "patient") => void;
  onOpenGetStarted: () => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
}

export function LandingNavbar({
  onSelectPersona,
  onOpenGetStarted,
}: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="hover:opacity-95 transition-opacity" aria-label="Hippocrates Home">
            <HippocratesLogo size="md" />
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav
            suppressHydrationWarning
            className="hidden md:flex items-center gap-7 lg:gap-8"
            aria-label="Main Navigation"
          >
            <Link href="/platform" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Platform
            </Link>
            <Link href="/get-started" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              App
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

          {/* Right: Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              onClick={onOpenGetStarted}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-full px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all duration-200"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
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
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-x-0 top-20 bottom-0 z-40 bg-white md:hidden overflow-y-auto px-6 py-8 border-t border-slate-100 flex flex-col justify-between shadow-xl animate-in fade-in slide-in-from-top-4 duration-200"
          style={{ height: "calc(100dvh - 5rem)" }}
        >
          <div className="space-y-6">
            <nav className="flex flex-col space-y-2.5" aria-label="Mobile Navigation">
              <Link href="/platform" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-2 border-b border-slate-100">
                Platform Architecture
              </Link>
              <Link href="/get-started" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-2 border-b border-slate-100">
                Android App (APK)
              </Link>
              <Link href="/knowledge" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-2 border-b border-slate-100">
                Knowledge Hub
              </Link>
              <Link href="/safety" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-2 border-b border-slate-100">
                Responsible AI &amp; Safety
              </Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-2 border-b border-slate-100">
                About Us
              </Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900 py-2 border-b border-slate-100">
                Contact Support
              </Link>
            </nav>
          </div>

          <div className="pt-8 mt-auto border-t border-slate-100">
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenGetStarted();
              }}
              className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white py-3.5 rounded-xl text-base font-medium shadow-md"
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
