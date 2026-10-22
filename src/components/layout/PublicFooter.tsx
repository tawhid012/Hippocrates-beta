"use client";

import Link from "next/link";
import { HippocratesLogo } from "@/components/landing/HippocratesLogo";
import { ShieldCheck, HeartPulse } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-4 space-y-4">
            <HippocratesLogo size="md" theme="dark" />
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              AI Clinical Platform featuring dual engines: Aegis, the patient-facing AI assistant for exploring health concerns, understanding reports, and consultation preparation; Oracle, the clinical copilot for verified physicians.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>AES-256 Encrypted • Zero Data Monetization</span>
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            {/* Column 1: Platform */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white tracking-wider text-xs uppercase">Platform</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link href="/platform" className="hover:text-white transition-colors">Architecture</Link></li>
                <li><Link href="/aegis" className="hover:text-white transition-colors">Aegis (Patients)</Link></li>
                <li><Link href="/oracle" className="hover:text-white transition-colors">Oracle (Doctors)</Link></li>
                <li><Link href="/medical-reports" className="hover:text-white transition-colors">Report Guide</Link></li>
                <li><Link href="/get-started" className="hover:text-white transition-colors">Android App &amp; PWA</Link></li>
              </ul>
            </div>

            {/* Column 2: Knowledge Hub */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white tracking-wider text-xs uppercase">Knowledge Hub</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link href="/knowledge" className="hover:text-white transition-colors">All Articles</Link></li>
                <li><Link href="/knowledge/understanding-cbc-blood-test" className="hover:text-white transition-colors">CBC Blood Test</Link></li>
                <li><Link href="/knowledge/understanding-liver-function-tests" className="hover:text-white transition-colors">Liver Function (LFT)</Link></li>
                <li><Link href="/knowledge/understanding-kidney-function-tests" className="hover:text-white transition-colors">Kidney Tests (KFT)</Link></li>
                <li><Link href="/knowledge/understanding-thyroid-panels" className="hover:text-white transition-colors">Thyroid Panels</Link></li>
              </ul>
            </div>

            {/* Column 3: Trust & Safety */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white tracking-wider text-xs uppercase">Trust &amp; Team</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Team</Link></li>
                <li><Link href="/safety" className="hover:text-white transition-colors">Responsible AI</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              </ul>
            </div>

            {/* Column 4: Legal & Clinical */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white tracking-wider text-xs uppercase">Legal</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Practices</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/disclaimer" className="hover:text-white transition-colors">Medical Disclaimer</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <span>© 2026 Hippocrates AI. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <HeartPulse className="h-3.5 w-3.5 text-blue-400" />
            <span>Built for responsible healthcare intelligence</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
