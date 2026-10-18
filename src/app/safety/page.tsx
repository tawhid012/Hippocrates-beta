import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { JsonLd, getMedicalWebPageJsonLd } from "@/components/seo/JsonLd";
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  Stethoscope,
  HeartPulse,
  Users,
  CheckCircle2,
  FileCheck,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Responsible Healthcare AI & Safety Principles — Hippocrates",
  description:
    "Explore our clinical safety framework: intended use, non-autonomous boundaries, emergency red-flag handling, state isolation, and physician-in-the-loop governance.",
  keywords: [
    "responsible AI in healthcare",
    "healthcare AI safety",
    "clinical AI ethics",
    "medical AI limitations",
    "AI hallucination mitigation",
    "emergency red flag protocol",
  ],
  alternates: {
    canonical: "/safety",
  },
  openGraph: {
    title: "Responsible Healthcare AI & Safety Principles — Hippocrates",
    description:
      "Clinical safety, transparency, emergency protocols, and physician governance are at the heart of the Hippocrates platform.",
    url: "/safety",
  },
};

export default function SafetyPage() {
  const safetyJsonLd = getMedicalWebPageJsonLd({
    title: "Responsible Healthcare AI & Safety Principles — Hippocrates",
    description:
      "A detailed declaration of Hippocrates clinical AI safety protocols, emergency gates, non-autonomous boundaries, and privacy safeguards.",
    url: "/safety",
    aspect: "Healthcare AI Safety & Ethics",
    citations: [
      "World Health Organization (WHO) Guidance: Ethics and Governance of AI for Health",
      "Indian Council of Medical Research (ICMR) Ethical Guidelines for AI in Healthcare",
      "Coalition for Health AI (CHAI) Trustworthy AI Framework",
    ],
  });

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <JsonLd schema={safetyJsonLd} />
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "Safety & Responsible AI", href: "/safety" }]} />

        {/* Hero Section */}
        <section className="pt-8 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2563eb]" />
              <span>Ethical Governance &amp; Clinical Safety</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
              Safety first. <br />
              <span className="text-blue-600">Always.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Healthcare AI must be held to higher standards of evidence, safety, and transparency than consumer software. At Hippocrates, our architecture is engineered with clinical guardrails, deterministic emergency escalation, and strict clinician-in-the-loop governance.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/disclaimer">
                <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-7 py-3 rounded-xl font-medium text-sm shadow-sm flex items-center gap-2 cursor-pointer">
                  <span>Read Medical Disclaimer</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/privacy">
                <Button variant="outline" className="border-slate-300 hover:bg-slate-50 text-slate-900 px-7 py-3 rounded-xl font-medium text-sm">
                  Privacy &amp; Data Security
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 6 Safety Pillars */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Core Safety Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Our Six Clinical Safety Pillars
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                How Hippocrates protects patient safety and upholds clinical integrity at every layer of the platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Pillar 1: Dual-Engine Role Isolation */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HeartPulse className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">1. Strict Role Boundaries</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We maintain total architectural separation between patient and clinician workspaces. Patient accounts are permanently bound to Aegis (educational and preparation only) and cannot access Oracle physician tools.
                </p>
              </div>

              {/* Pillar 2: Emergency Red-Flag Protocols */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">2. Emergency Red-Flag Gates</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  When acute emergency symptoms (such as retrosternal chest pain, signs of stroke, acute respiratory distress, or severe hemorrhage) are detected, conversational AI exploration is immediately halted, and emergency dispatch guidance is displayed.
                </p>
              </div>

              {/* Pillar 3: Non-Autonomous Decision-Support */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">3. Non-Autonomous Practice</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Hippocrates does not claim autonomous diagnostic authority, does not prescribe pharmaceuticals, and does not replace human clinical expertise. Oracle acts purely as cognitive decision support for licensed medical doctors.
                </p>
              </div>

              {/* Pillar 4: Clinical State Isolation */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">4. Context Leakage Prevention</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Cross-consultation contamination is mathematically eliminated. Every consultation session initializes with a pristine clinical state, and case notes are sandboxed with user-isolated database row-level security.
                </p>
              </div>

              {/* Pillar 5: Verified Physician Credentials */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">5. Doctor Verification</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Access to Oracle physician features requires entry and verification of an official Medical Council Registration Number. Unverified accounts cannot interact with physician-level differential reasoning tools.
                </p>
              </div>

              {/* Pillar 6: Zero Health Data Monetization */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">6. Zero Data Monetization</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We never sell, broker, or repurpose patient health conversations or diagnostic lab data for advertising. All sensitive records are encrypted in transit via TLS 1.3 and at rest with AES-256.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Clear Medical Limitations */}
        <section className="py-16 bg-[#fcfdfe] border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Transparent Boundaries
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                What Hippocrates CAN and CANNOT Do
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-3">
                <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>What Hippocrates DOES</span>
                </h3>
                <ul className="text-xs text-emerald-800 space-y-2 list-disc list-inside">
                  <li>Translates complex medical laboratory parameters into understandable explanations.</li>
                  <li>Helps patients organize symptom timelines (OPQRST) before doctor visits.</li>
                  <li>Generates high-yield question checklists to empower patient advocacy.</li>
                  <li>Provides licensed clinicians with differential checklists and guideline references.</li>
                  <li>Automates clinical SOAP documentation to reduce clinician administrative burnout.</li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-200/70 space-y-3">
                <h3 className="font-semibold text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  <span>What Hippocrates DOES NOT DO</span>
                </h3>
                <ul className="text-xs text-rose-800 space-y-2 list-disc list-inside">
                  <li>Does NOT provide autonomous medical diagnoses or definitive clinical verdicts.</li>
                  <li>Does NOT prescribe medications or adjust pharmaceutical dosage regimens.</li>
                  <li>Does NOT replace in-person physical examinations, palpation, or auscultation.</li>
                  <li>Does NOT function as an emergency medical dispatch or resuscitation system.</li>
                  <li>Does NOT sell or monetize private patient health conversations.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Educational Disclaimer */}
        <section className="py-12 bg-slate-100 border-t border-slate-200 text-slate-600 text-xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-2">
            <p className="font-semibold text-slate-800">Compliance &amp; Governance Statement</p>
            <p>
              Hippocrates AI is developed in alignment with the World Health Organization (WHO) guidance on ethics and governance of artificial intelligence for health and the Indian Council of Medical Research (ICMR) ethical guidelines for AI in healthcare.
            </p>
          </div>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
