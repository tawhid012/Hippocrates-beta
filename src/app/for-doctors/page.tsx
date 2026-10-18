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
  FileText,
  ArrowRight,
  Shield,
  ShieldAlert,
} from "lucide-react";

export const metadata: Metadata = {
  title: "For Doctors — Oracle AI Clinical Copilot & Decision Support",
  description:
    "Oracle empowers physicians with multi-model differential diagnostic reasoning, clinical guidelines synthesis, risk stratification (CRB-65, Wells), and SOAP documentation.",
  keywords: [
    "AI clinical copilot for doctors",
    "clinical decision support software",
    "physician differential diagnosis",
    "AI tools for medical doctors",
    "medical documentation automation",
    "Hippocrates for doctors",
  ],
  alternates: {
    canonical: "/for-doctors",
  },
  openGraph: {
    title: "For Doctors — Oracle AI Clinical Copilot & Decision Support",
    description:
      "Augment clinical workflows with evidence-grounded differential reasoning, risk stratification scores, and automated SOAP documentation. Verified physician access only.",
    url: "/for-doctors",
  },
};

const DOCTOR_FAQS = [
  {
    question: "How does Oracle prevent anchor bias during clinical workups?",
    answer:
      "Oracle structures differential diagnoses into categories (most common, atypical, and high-risk can't-miss conditions), prompting the clinician with pertinent negative findings required to rule each etiology in or out.",
  },
  {
    question: "Is clinical documentation exportable?",
    answer:
      "Yes. Oracle generates structured SOAP (Subjective, Objective, Assessment, Plan) consultation summaries and formal physician notes that can be exported directly as formatted PDFs or copied into institutional EMRs.",
  },
  {
    question: "What registration credentials are required?",
    answer:
      "In accordance with clinical safety protocols, accessing the Oracle copilot requires verifying your official Medical Council Registration Number during account onboarding.",
  },
];

export default function ForDoctorsPage() {
  const softwareJsonLd = getOracleSoftwareJsonLd();
  const faqJsonLd = getFaqJsonLd(DOCTOR_FAQS);

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <JsonLd schema={[softwareJsonLd, faqJsonLd]} />
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "For Doctors", href: "/for-doctors" }]} />

        {/* Hero Section */}
        <section className="pt-8 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
                <Stethoscope className="h-3.5 w-3.5 text-[#2563eb]" />
                <span>Oracle Clinical Copilot for Physicians</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
                Clinical intelligence for <br />
                <span className="text-blue-600">faster, sharper decisions.</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Oracle is an advanced AI clinical copilot built for doctors. Access multi-model diagnostic reasoning, differential evaluations, treatment guidelines, and case history management instantly.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/?persona=doctor">
                  <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-8 py-3.5 rounded-xl font-medium text-sm shadow-sm flex items-center gap-2 cursor-pointer">
                    <span>Try Oracle Clinical</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/platform">
                  <Button variant="outline" className="border-slate-300 hover:bg-slate-50 text-slate-900 px-7 py-3.5 rounded-xl font-medium text-sm">
                    Platform Overview
                  </Button>
                </Link>
              </div>

              {/* Verification notice */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-900">
                <ShieldAlert className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Professional Verification Notice:</strong> In compliance with clinical governance standards, full access to Oracle requires entry and validation of your official Medical Council Registration Number.
                </div>
              </div>
            </div>

            {/* Right Card */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-2xl space-y-5 border border-slate-800">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      O
                    </div>
                    <div>
                      <h2 className="font-semibold text-white text-sm">Oracle Clinical Copilot</h2>
                      <span className="text-[11px] text-blue-400 font-medium">Model: Gemini 2.5 Pro Clinical</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-mono bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  <p className="text-blue-400"># Case Assessment &amp; Differentials</p>
                  <p>1. Primary Differential: Acute Bronchitis vs. Early Community-Acquired Pneumonia</p>
                  <p>2. Recommended Labs: Complete CBC, Inflammatory markers (CRP), Chest X-ray</p>
                  <p>3. Risk Stratification: CRB-65 Score: 0 (Low Risk)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Features Grid */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Built for Practitioners
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Empowering clinical expertise
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Oracle acts as an intelligent sounding board to assist with diagnosis formulation, literature review, and complex case documentation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Multi-Model Switching</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Seamlessly toggle between specialized clinical models optimized for speed, deep reasoning, or structured medical synthesis.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Differential &amp; Guidelines</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Generate comprehensive differential diagnoses, recommended diagnostic workups, and evidence-based clinical considerations in seconds.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Secure Case Vault</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Organize, rename, and review past patient consultations and clinical inquiries securely with isolated local and cloud persistence.
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
                Common Questions for Clinicians
              </h2>
            </div>

            <div className="space-y-4">
              {DOCTOR_FAQS.map((faq, idx) => (
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
      </div>

      <PublicFooter />
    </div>
  );
}
