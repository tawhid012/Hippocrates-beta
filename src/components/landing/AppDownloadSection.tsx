import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Smartphone, CheckCircle2 } from "lucide-react";

export function AppDownloadSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-slate-200/80 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-8 sm:p-12 lg:p-16 overflow-hidden relative">
          {/* Subtle decorative background glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50/70 rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Release Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                <span>Android App Available • Standalone Package</span>
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-slate-900 leading-[1.12]">
                  Your Hippocrates experience.{" "}
                  <br className="hidden sm:inline" />
                  <span className="text-blue-600">On the go.</span>
                </h2>
                <p className="text-slate-600 text-base sm:text-lg max-w-xl leading-relaxed">
                  Take Hippocrates with you on Android and access the features available in the mobile app. Explore health reports, clarify symptoms, and prepare consultation notes wherever you are.
                </p>
              </div>

              {/* Value Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Symptom clarity &amp; consultation prep</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Medical report explanations</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Ultra-compact 4.9 MB download</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Encrypted, privacy-first design</span>
                </div>
              </div>

              {/* Action Buttons — Directs to official download page (no direct download on homepage) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-4">
                <Link
                  href="/get-started"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all inline-flex items-center justify-center gap-2.5 cursor-pointer group"
                >
                  <Smartphone className="h-4 w-4 text-white" />
                  <span>Get the Android App</span>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/get-started#install-guide"
                  className="border border-slate-300 hover:bg-slate-50 text-slate-800 px-6 py-4 rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Installation Guide</span>
                </Link>
              </div>

              {/* Trust Details Micro-row */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Official Download Page • ai.hippocrates.app</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span>SHA-256 Verified Release</span>
              </div>
            </div>

            {/* Right Visual Column (5 cols) — Photorealistic Smartphone Visual */}
            <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
              <div className="relative flex items-center justify-center w-full max-w-[380px]">
                <Image
                  src="/hippocrates-android-device.jpg"
                  alt="Hippocrates Android Mobile Experience"
                  width={480}
                  height={480}
                  className="w-full h-auto object-contain rounded-3xl drop-shadow-[0_20px_45px_rgba(15,23,42,0.16)] select-none hover:scale-[1.02] transition-transform duration-500"
                  priority
                />

                {/* Floating Verified Badge */}
                <div className="absolute -bottom-3 left-4 sm:-left-3 bg-white/95 backdrop-blur-md border border-slate-200/80 p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900">Official Android Release</p>
                    <p className="text-[10px] text-slate-500 font-medium">v1.0.0 • 4.88 MB • ai.hippocrates.app</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
