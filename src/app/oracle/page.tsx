import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { JsonLd, getOracleSoftwareJsonLd, getFaqJsonLd } from "@/components/seo/JsonLd";
import {
  Stethoscope,
  Cpu,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Activity,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Oracle — Doctor-Focused Clinical Support & Decision Reasoning",
  description:
    "Explore Oracle by Hippocrates: a doctor-focused clinical copilot designed to support clinical workflows, differential reasoning, and documentation for verified clinicians.",
  keywords: [
    "Hippocrates Oracle",
    "AI clinical copilot",
    "clinical decision support software",
    "doctor-focused clinical support",
    "differential diagnosis reasoning",
    "clinical documentation AI",
    "physician workflow copilot",
  ],
  alternates: {
    canonical: "/oracle",
  },
  openGraph: {
    title: "Oracle — Doctor-Focused Clinical Support & Decision Reasoning",
    description:
      "Explore Oracle by Hippocrates: a doctor-focused clinical copilot designed to support clinical workflows, differential reasoning, and documentation for verified clinicians.",
    url: "/oracle",
    images: [
      {
        url: "/hippocrates-og.png",
        width: 1024,
        height: 536,
        alt: "Oracle by Hippocrates — Doctor-Focused Clinical Support",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oracle — Doctor-Focused Clinical Support & Decision Reasoning",
    description:
      "Explore Oracle by Hippocrates: a doctor-focused clinical copilot designed to support clinical workflows, differential reasoning, and documentation for verified clinicians.",
    images: ["/hippocrates-og.png"],
  },
};

const ORACLE_FAQS = [
  {
    question: "What is Hippocrates Oracle?",
    answer:
      "Oracle is the clinician-facing engine of Hippocrates. It serves as an evidence-grounded clinical decision support copilot for doctors, residents, and healthcare practitioners, supporting differential diagnosis, risk score calculations, and case documentation.",
  },
  {
    question: "Does Oracle make autonomous diagnostic decisions?",
    answer:
      "No. Oracle is strictly a decision-support and cognitive augmentation tool. It does not replace independent clinical judgment, prescribe medications autonomously, or issue legally binding diagnostic verdicts. All outputs must be evaluated by a licensed human physician.",
  },
  {
    question: "Why is a Doctor Registration Number required?",
    answer:
      "To enforce clinical safety and regulatory boundaries, access to the Oracle workspace is restricted to verified healthcare professionals. Doctors must provide their official Medical Council Registration Number upon onboarding.",
  },
  {
    question: "Which clinical models power Oracle?",
    answer:
      "Oracle is architected with multi-model switching, utilizing specialized medical reasoning models (such as Gemini 2.5 Pro Clinical and Gemini Flash) with fallback resilience and evidence-grounded prompt constraints.",
  },
];

export default function OraclePage() {
  const softwareJsonLd = getOracleSoftwareJsonLd();
  const faqJsonLd = getFaqJsonLd(ORACLE_FAQS);

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <JsonLd schema={[softwareJsonLd, faqJsonLd]} />
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "Oracle Clinical Copilot", href: "/oracle" }]} />

        {/* Hero Section */}
        <section className="pt-8 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
                <Stethoscope className="h-3.5 w-3.5 text-[#2563eb]" />
                <span>Physician Clinical Copilot • Verified Clinician Access</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
                Clinical intelligence for <br />
                <span className="text-blue-600">faster, sharper decisions.</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Oracle is an advanced AI clinical copilot built exclusively for physicians. Synthesize complex case histories, explore multi-model differential reasoning, evaluate clinical risk scores, and generate structured documentation instantly.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/?persona=doctor">
                  <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-8 py-3.5 rounded-xl font-medium text-sm shadow-sm flex items-center gap-2 cursor-pointer">
                    <span>Access Oracle Clinical</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/for-doctors">
                  <Button variant="outline" className="border-slate-300 hover:bg-slate-50 text-slate-900 px-7 py-3.5 rounded-xl font-medium text-sm">
                    Clinical Workflow Guide
                  </Button>
                </Link>
              </div>

              {/* Physician Verification Badge */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-900">
                <ShieldAlert className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Professional Verification Protocol:</strong> In compliance with healthcare clinical safety guidelines, Oracle workspace access requires valid Medical Council Registration verification.
                </div>
              </div>
            </div>

            {/* Terminal / Clinical reasoning preview */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-2xl space-y-5 border border-slate-800">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      O
                    </div>
                    <div>
                      <h2 className="font-semibold text-white text-sm">Oracle Clinical Copilot</h2>
                      <span className="text-[11px] text-blue-400 font-medium">Engine: Multi-Model Clinical Reasoning</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Verified MD
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-mono bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  <p className="text-blue-400"># Case Assessment &amp; Differentials</p>
                  <p>1. Primary Differential: Acute Bronchitis vs. Early Community-Acquired Pneumonia</p>
                  <p>2. Recommended Workup: Complete CBC, CRP, Chest Radiograph (PA/Lateral)</p>
                  <p>3. Risk Stratification: CRB-65 Score: 0 (Low Risk, Outpatient Management Eligible)</p>
                  <p className="text-slate-400">4. Evidentiary Guidelines: ICMR Adult Pneumonia Guidelines 2024</p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                  <span>SOAP Note Auto-Formatting</span>
                  <span className="text-emerald-400">Zero Patient PII Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Physician Features */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Physician Decision Support
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Designed to reduce cognitive fatigue and anchor bias.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Explore four essential modules tailored for high-volume outpatient and hospital workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/70 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Differential Diagnosis</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Broadens diagnostic perspective by presenting structured primary, atypical, and high-risk can&apos;t-miss differentials with pertinent negative criteria.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/70 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Clinical Documentation</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Transforms consultation discussions into clean, standardized SOAP notes and physician summaries with one-click PDF generation.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/70 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Risk Stratification</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Integrates validated medical scoring tools (such as CRB-65, Wells criteria, and CHA₂DS₂-VASc) to evaluate hospitalization versus outpatient safety.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/70 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Multi-Model Reasoning</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Allows clinicians to compare diagnostic evaluations across cutting-edge clinical reasoning models with deterministic safety rails.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 bg-[#fcfdfe] border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Common Questions About Oracle
              </h2>
            </div>

            <div className="space-y-4">
              {ORACLE_FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2"
                >
                  <h3 className="font-semibold text-slate-900 text-base">{faq.question}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Physician CTA Banner */}
        <section className="py-16 bg-slate-900 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Enhance your clinical workflow today.
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
              Join verified physicians using Oracle to assist with differential reasoning, guideline synthesis, and rapid documentation.
            </p>
            <div className="pt-2">
              <Link href="/?persona=doctor">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-medium text-sm shadow-md cursor-pointer">
                  Launch Oracle Clinical Copilot
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
