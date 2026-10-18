import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Stethoscope,
  HeartPulse,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Get Started & Install App — Hippocrates AI",
  description:
    "Start using Hippocrates AI today on web, iOS, and Android. Learn how to install our Progressive Web App (PWA) and onboard as a patient or clinician.",
  keywords: [
    "Hippocrates app",
    "download Hippocrates",
    "install Hippocrates PWA",
    "get started with Hippocrates",
    "AI doctor app",
    "Aegis app",
    "Oracle clinical app",
  ],
  alternates: {
    canonical: "/get-started",
  },
  openGraph: {
    title: "Get Started & Install App — Hippocrates AI",
    description:
      "Access Hippocrates AI immediately across all devices. Install as a mobile PWA or launch in any modern browser.",
    url: "/get-started",
  },
};

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "Get Started & Download", href: "/get-started" }]} />

        {/* Hero Section */}
        <section className="pt-8 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
              <Smartphone className="h-3.5 w-3.5 text-[#2563eb]" />
              <span>Multi-Platform Availability • Web, iOS, Android</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
              Experience Hippocrates. <br />
              <span className="text-blue-600">On every screen.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Hippocrates runs seamlessly across desktop computers, tablets, and mobile smartphones without requiring bulky app store downloads. Access directly via your web browser or install as a Progressive Web App (PWA) with one tap.
            </p>
          </div>
        </section>

        {/* Onboarding Tracks: Patient vs Doctor */}
        <section className="py-12 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Choose Your Pathway
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Two Dedicated Onboarding Experiences
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Patient Track */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <HeartPulse className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">For Patients (Aegis)</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Start a free educational consultation with Aegis. Translate medical test reports, organize symptom chronologies, and prepare targeted questions for your doctor.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-2.5">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Instant signup with email, Google, or mobile phone</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Free educational access to standard symptom exploration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Aegis Pro real-time voice mode supported</span>
                    </li>
                  </ul>
                </div>
                <Link href="/?persona=patient">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-medium text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                    <span>Launch Aegis Patient Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Doctor Track */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <Stethoscope className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">For Clinicians (Oracle)</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Designed for verified physicians, residents, and healthcare providers. Access multi-model differential reasoning, clinical guidelines synthesis, and documentation support.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-2.5">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Medical Council Registration Number verification required</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Multi-model clinical engine comparison (Gemini Pro Clinical)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Structured SOAP notes and one-click PDF export</span>
                    </li>
                  </ul>
                </div>
                <Link href="/?persona=doctor">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-medium text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                    <span>Launch Oracle Clinical Copilot</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PWA Mobile Installation Guide */}
        <section className="py-16 bg-[#fcfdfe] border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                PWA Mobile Installation
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                How to Install Hippocrates on Mobile
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Follow these simple steps to install Hippocrates directly to your phone&apos;s home screen for full-screen, native-feeling performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* iOS Safari Guide */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-sm">
                    iOS
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">Apple iPhone &amp; iPad (Safari)</h3>
                    <p className="text-xs text-slate-500">Requires Safari browser</p>
                  </div>
                </div>

                <ol className="space-y-4 text-sm text-slate-700 list-decimal list-inside">
                  <li className="leading-relaxed">
                    Open Safari and navigate to <strong>https://www.hippocrates.in</strong> (or your deployment URL).
                  </li>
                  <li className="leading-relaxed">
                    Tap the <strong>Share</strong> icon (square with an arrow pointing upward) at the bottom toolbar.
                  </li>
                  <li className="leading-relaxed">
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Confirm by tapping <strong>Add</strong> in the top-right corner. The Hippocrates icon will appear on your home screen.
                  </li>
                </ol>
              </div>

              {/* Android Chrome Guide */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-sm">
                    Android
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">Android Devices (Chrome / Brave)</h3>
                    <p className="text-xs text-slate-500">Requires modern Chromium browser</p>
                  </div>
                </div>

                <ol className="space-y-4 text-sm text-slate-700 list-decimal list-inside">
                  <li className="leading-relaxed">
                    Open Chrome and navigate to <strong>https://www.hippocrates.in</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Tap the <strong>Three-Dots Menu</strong> icon (⋮) in the top-right corner.
                  </li>
                  <li className="leading-relaxed">
                    Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Follow the on-screen prompt to install. Hippocrates will launch in a clean, standalone full-screen window.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
