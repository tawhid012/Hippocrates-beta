import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { JsonLd, getAegisSoftwareJsonLd, getOracleSoftwareJsonLd } from "@/components/seo/JsonLd";
import { Sparkles, Stethoscope, Shield, Lock, ArrowRight, Cpu, Activity, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Platform Architecture — Dual-Engine Clinical Intelligence",
  description:
    "Explore the Hippocrates dual-engine architecture: Aegis for patient health understanding and Oracle for physician clinical decision support and differential reasoning.",
  keywords: [
    "Hippocrates platform",
    "dual-engine clinical AI",
    "healthcare AI architecture",
    "Aegis and Oracle",
    "clinical decision support system",
    "medical AI infrastructure",
  ],
  alternates: {
    canonical: "/platform",
  },
  openGraph: {
    title: "Platform Architecture — Dual-Engine Clinical Intelligence",
    description:
      "A technical and clinical overview of Hippocrates' dual-engine AI platform: Aegis for patients and Oracle for physicians.",
    url: "/platform",
  },
};

export default function PlatformPage() {
  const aegisJsonLd = getAegisSoftwareJsonLd();
  const oracleJsonLd = getOracleSoftwareJsonLd();

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <JsonLd schema={[aegisJsonLd, oracleJsonLd]} />
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "Platform Architecture", href: "/platform" }]} />

        {/* Hero Section */}
        <section className="pt-8 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
              <Sparkles className="h-3.5 w-3.5 text-[#2563eb]" />
              <span>Hippocrates Core Architecture</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
              Dual-Engine <br />
              <span className="text-blue-600">Clinical Intelligence.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Explore how Hippocrates bridges the gap between complex medical documentation, patient understanding, and physician decision-making with advanced AI architectures.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/?persona=patient">
                <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-7 py-3 rounded-xl font-medium text-sm shadow-sm flex items-center gap-2 cursor-pointer">
                  <span>Launch Platform App</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/for-doctors">
                <Button variant="outline" className="border-slate-300 hover:bg-slate-50 text-slate-900 px-7 py-3 rounded-xl font-medium text-sm">
                  For Doctors
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Core Modules Section */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Dual-Engine Architecture</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Two specialized engines. One secure system.</h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Tailored interaction models built to address the distinct needs of patients seeking clarity and physicians demanding clinical precision.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Aegis Engine */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Activity className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Aegis Patient Health Assistant</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    The patient-facing AI assistant within HIPPOCRATES. Aegis helps users explore health concerns conversationally, organize symptom histories using the OPQRST framework, understand medical reports, recognize potential warning signs, and prepare for informed doctor consultations.
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Conversational Health Assistance &amp; Follow-up Clarification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Structured OPQRST Symptom Histories &amp; Clinical Timelines</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Medical Report Intelligence (CBC, LFT, KFT, Thyroid Panels)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Doctor Consultation Preparation &amp; Question Checklists</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Deterministic Emergency Warning-Sign Recognition &amp; Triage</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">For Patients &amp; Families</span>
                  <Link href="/aegis" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                    Explore Aegis <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Oracle Engine */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <Stethoscope className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Oracle Clinical Decision Copilot</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Engineered for physicians and healthcare practitioners. Oracle integrates multi-model clinical reasoning, differential diagnosis generation, treatment guideline citations, and rapid literature synthesis.
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Multi-Model Clinical Switching (Flash &amp; Pro Clinical)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Differential Diagnosis &amp; Clinical Risk Stratification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Doctor Registration Number Verification Protocol</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">For Physicians &amp; Clinicians</span>
                  <Link href="/oracle" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                    Explore Oracle <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Infrastructure Highlights */}
        <section className="py-20 bg-[#fbfcfd] border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-slate-900 text-base">End-to-End Encryption</h4>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  All clinical transcripts, lab reports, and case histories are encrypted at rest and in transit using TLS 1.3 and AES-256 standards.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Cpu className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-slate-900 text-base">Advanced AI Grounding</h4>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Powered by state-of-the-art multimodal AI models with evidence-based prompt constraints designed to uphold medical safety protocols.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-slate-900 text-base">Strict Data Privacy</h4>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Your health information is never monetized, sold, or shared with third-party advertisers. Strict Supabase row-level security isolates every user profile.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
