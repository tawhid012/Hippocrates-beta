import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { JsonLd, getAegisSoftwareJsonLd, getFaqJsonLd } from "@/components/seo/JsonLd";
import {
  HeartPulse,
  MessageSquare,
  FileText,
  Clock,
  ClipboardList,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "For Patients — Aegis Patient-Facing AI Assistant | HIPPOCRATES",
  description:
    "Aegis is a patient-facing AI assistant within HIPPOCRATES. Explore health concerns, understand medical reports, organise symptoms with OPQRST, and prepare for doctor visits.",
  keywords: [
    "patient-facing healthcare AI assistant",
    "AI health information assistant",
    "AI medical report explanation",
    "symptom history and doctor visit preparation",
    "HIPPOCRATES Aegis",
    "OPQRST symptom timeline",
    "patient health assistant",
  ],
  alternates: {
    canonical: "/for-patients",
  },
  openGraph: {
    title: "For Patients — Aegis Patient-Facing AI Assistant | HIPPOCRATES",
    description:
      "Aegis helps patients explore health concerns, understand medical reports, organise symptoms with OPQRST, recognise warning signs, and prepare for doctor visits.",
    url: "/for-patients",
  },
};

const PATIENT_FAQS = [
  {
    question: "What is Hippocrates Aegis?",
    answer:
      "Aegis is the patient-facing AI assistant within HIPPOCRATES. It helps users explore health concerns conversationally, understand medical reports, organize symptoms using clinical frameworks like OPQRST, recognize potential warning signs, and prepare structured questions for doctor appointments.",
  },
  {
    question: "How does Aegis help me prepare for a doctor visit?",
    answer:
      "Aegis guides you through a clinical symptom inquiry framework (OPQRST: Onset, Provocation/Palliation, Quality, Region/Radiation, Severity, Time) and produces an organized summary along with high-yield questions for your physician.",
  },
  {
    question: "Can Aegis diagnose my medical condition?",
    answer:
      "No. Aegis is strictly an educational and consultation-preparation assistant. It does not provide medical diagnoses, prescribe treatments, or replace qualified clinicians. All insights are designed to support your discussion with a licensed healthcare professional.",
  },
  {
    question: "How does Aegis handle emergency warning signs?",
    answer:
      "Aegis includes deterministic emergency-triage safety gates. If you enter critical red-flag symptoms—such as crushing chest pain, severe shortness of breath, or stroke warning signs—Aegis immediately directs you to contact local emergency medical services (108/112 in India, 911 in the US). It does not replace emergency response services.",
  },
  {
    question: "Is my personal health data kept confidential?",
    answer:
      "Yes. HIPPOCRATES utilizes strict database row-level security and encryption. Your conversations and records are private, user-isolated, and never sold or used for advertising.",
  },
];

export default function ForPatientsPage() {
  const softwareJsonLd = getAegisSoftwareJsonLd();
  const faqJsonLd = getFaqJsonLd(PATIENT_FAQS);

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <JsonLd schema={[softwareJsonLd, faqJsonLd]} />
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "For Patients", href: "/for-patients" }]} />

        {/* Hero Section */}
        <section className="pt-8 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
                <HeartPulse className="h-3.5 w-3.5 text-[#2563eb]" />
                <span>HIPPOCRATES · AEGIS</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
                Understand your health. <br />
                <span className="text-blue-600">Navigate your next steps.</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Aegis is a patient-facing AI assistant that helps you explore health concerns, understand medical reports, organise symptoms, recognise potential warning signs, and prepare for more informed conversations with healthcare professionals.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/?persona=patient">
                  <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-8 py-3.5 rounded-xl font-medium text-sm shadow-sm flex items-center gap-2 cursor-pointer">
                    <span>Explore Aegis</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/platform">
                  <Button variant="outline" className="border-slate-300 hover:bg-slate-50 text-slate-900 px-7 py-3.5 rounded-xl font-medium text-sm">
                    Discover HIPPOCRATES
                  </Button>
                </Link>
              </div>

              {/* Safety notice */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Clinical Safety Notice:</strong> Aegis provides health education, symptom organization, and consultation preparation. It does not provide medical diagnoses or replace emergency medical services. For severe or sudden symptoms, call emergency services (108 / 112 / 911) immediately.
                </div>
              </div>
            </div>

            {/* Right Card / Mockup preview */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xl space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    A
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 text-sm">Aegis Patient Intelligence</h2>
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      ● Active Educational Session
                    </span>
                  </div>
                </div>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-slate-700">
                    &quot;To help prepare a clear summary for your doctor, let&apos;s look at the timeline. Did the pain start suddenly or build up gradually, and does anything make it better or worse?&quot;
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 ml-6">
                    &quot;It started gradually two days ago, feels dull and aching, and gets worse after meals.&quot;
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-slate-700">
                    &quot;Understood. We&apos;ve logged the Onset, Quality, and Provoking factors. Let&apos;s organize 3 targeted questions to ask your physician during your visit.&quot;
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Structured OPQRST Inquiry</span>
                  <span className="font-mono text-blue-600">Encrypted Consultation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Patient Features Grid */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Aegis Engine Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Designed to make healthcare understandable.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Four core ways Aegis empowers patients before, during, and after medical consultations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Conversational Health Assistance</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Ask health questions freely, explore symptoms interactively, and receive calm, accessible explanations without intimidating jargon.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Structured Symptom Understanding</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Organizes symptoms into a clinical OPQRST timeline (Onset, Provocation, Quality, Region, Severity, Time) so doctors get the full picture quickly.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Medical Report Intelligence</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Plain-language explanations of CBC, LFT, KFT, and thyroid panels, helping you understand values, reference brackets, and clinician questions.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Doctor Consultation Preparation</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Summarizes your symptom history, clarifies what you are experiencing, and creates tailored question checklists for your doctor visit.
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
                Common Questions for Patients
              </h2>
            </div>

            <div className="space-y-4">
              {PATIENT_FAQS.map((faq, idx) => (
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
