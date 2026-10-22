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
  Clock,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  Shield,
  Lock,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Aegis — Patient-Facing AI Assistant | HIPPOCRATES",
  description:
    "Aegis is a patient-facing AI assistant within HIPPOCRATES that helps you explore health concerns, understand medical reports, organise symptoms, and prepare for doctor visits.",
  keywords: [
    "Patient-facing healthcare AI assistant",
    "AI health information assistant",
    "AI medical report explanation",
    "Symptom history and doctor visit preparation",
    "HIPPOCRATES Aegis",
    "OPQRST symptom timeline",
    "CBC blood test explanation",
    "patient health guidance",
  ],
  alternates: {
    canonical: "/aegis",
  },
  openGraph: {
    title: "Aegis — Patient-Facing AI Assistant | HIPPOCRATES",
    description:
      "Aegis is a patient-facing AI assistant within HIPPOCRATES that helps you explore health concerns, understand medical reports, organise symptoms, recognise potential warning signs, and prepare for doctor visits.",
    url: "/aegis",
    images: [
      {
        url: "/hippocrates-og.png",
        width: 1024,
        height: 536,
        alt: "Aegis by HIPPOCRATES — Patient-Facing AI Assistant",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aegis — Patient-Facing AI Assistant | HIPPOCRATES",
    description:
      "Aegis is a patient-facing AI assistant within HIPPOCRATES that helps you explore health concerns, understand medical reports, organise symptoms, and prepare for doctor visits.",
    images: ["/hippocrates-og.png"],
  },
};

const AEGIS_FAQS = [
  {
    question: "What is HIPPOCRATES Aegis?",
    answer:
      "Aegis is the patient-facing AI assistant within the HIPPOCRATES dual-engine platform. It helps individuals explore health concerns conversationally, understand medical laboratory reports in plain language, organize symptoms into structured clinical timelines using the OPQRST framework, recognize potential warning signs, and prepare high-yield questions for doctor visits.",
  },
  {
    question: "Is Aegis merely a medical report translator or symptom checker?",
    answer:
      "No. While Aegis provides comprehensive laboratory report intelligence, that is only one of its capabilities. Aegis is a broader health assistant designed to explore ongoing concerns, structure clinical symptom histories, identify acute emergency risks, and prepare patients for informed, productive consultations with clinicians.",
  },
  {
    question: "Can Aegis give me an autonomous medical diagnosis?",
    answer:
      "No. Aegis is strictly an educational and consultation-preparation assistant. It does not provide medical diagnoses, prescribe prescription pharmaceuticals, or alter therapies. All insights are designed to support your dialogue with a qualified clinician.",
  },
  {
    question: "What is the OPQRST framework used by Aegis?",
    answer:
      "OPQRST is a standardized clinical inquiry method: Onset (how symptoms started), Provocation/Palliation (what triggers or relieves them), Quality (what the sensation feels like), Region/Radiation (where it is located and whether it moves), Severity (impact scale from 1–10), and Time (duration, progression, and daily pattern). Aegis helps organize your history along these dimensions so your doctor receives clear clinical context.",
  },
  {
    question: "Which medical laboratory reports does Aegis support?",
    answer:
      "Aegis explains standard laboratory panels including Complete Blood Count (CBC), Liver Function Tests (LFT), Kidney Function Tests (KFT), and Thyroid Function Tests (TSH, Free T3/T4). It breaks down biological markers, typical reference intervals, and questions to discuss with your physician.",
  },
  {
    question: "How does Aegis handle medical emergencies?",
    answer:
      "Aegis incorporates deterministic emergency-triage safety rules. If acute warning signs—such as severe chest pain radiating to the jaw/arm, sudden difficulty breathing, or stroke warning signs—are detected, Aegis halts informational dialogue and directs you to contact local emergency medical services (108/112 in India, 911 in the US) immediately. Aegis does not replace emergency response services.",
  },
  {
    question: "How is my personal health data protected in Aegis?",
    answer:
      "Your data is protected by Supabase row-level security (RLS) and end-to-end user isolation. Health conversations are confidential, never sold or shared with advertisers, and retained only according to your explicit account settings and consent.",
  },
];

export default function AegisPage() {
  const softwareJsonLd = getAegisSoftwareJsonLd();
  const faqJsonLd = getFaqJsonLd(AEGIS_FAQS);

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <JsonLd schema={[softwareJsonLd, faqJsonLd]} />
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "Aegis Health Assistant", href: "/aegis" }]} />

        {/* Section 1: Hero Section */}
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

              {/* Emergency Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Clinical Safety Notice:</strong> Aegis provides general health education, symptom organization, and consultation preparation. It does not provide medical diagnoses or replace emergency medical services. For acute chest pain, severe shortness of breath, or emergency warning signs, call emergency services (108 / 112 / 911) immediately.
                </div>
              </div>
            </div>

            {/* Interactive Preview Card */}
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
                    &quot;To help prepare a clear summary for your doctor, let&apos;s look at the timeline. Did the discomfort start suddenly or build up gradually, and does anything relieve it?&quot;
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 ml-6">
                    &quot;It started gradually two days ago, feels dull and aching, and gets slightly worse after eating.&quot;
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-slate-700">
                    &quot;I&apos;ve logged the Onset and Provoking factors using OPQRST. In your CBC report, your hemoglobin was 11.4 g/dL. Here are 3 specific questions to discuss with your doctor.&quot;
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Structured OPQRST Timeline</span>
                  <span className="font-mono text-blue-600">Encrypted Consultation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Conversational Health Assistance */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Conversational Health Assistance
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  Explore health concerns interactively, with calm clarity.
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Healthcare questions rarely fit into rigid checkboxes. Aegis allows you to ask health-related questions in your own words, explore concerns through natural follow-up conversations, and receive accessible, empathetic explanations of medical information without confusing medical jargon.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      <strong>Follow-up dialogue:</strong> Clarifies nuances in your symptoms step-by-step rather than jumping to alarming conclusions.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      <strong>Accessible language:</strong> Complex clinical terms are translated into plain, relatable concepts you can understand immediately.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      <strong>Interactive voice &amp; text:</strong> Engage by typing or speaking naturally from your browser with ultra-low latency.
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Empathetic Clinical Dialogue</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Aegis is calibrated to feel like speaking with a calm, attentive clinician during an outpatient consultation. It never rushes you, asks thoughtful clarifying questions, and respects the context of your personal health journey.
                  </p>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/70 text-xs text-slate-600 space-y-2">
                    <div className="font-semibold text-slate-900">Example Patient Exploration:</div>
                    <p className="italic text-slate-500">
                      &quot;I&apos;ve been feeling lightheaded in the afternoons. Could this be related to my blood sugar, hydration, or something else?&quot;
                    </p>
                    <p className="text-slate-700">
                      Aegis guides you through meal timing, fluid intake, and associated symptoms before organizing structured points for your doctor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Medical Report Intelligence */}
        <section className="py-20 bg-[#fbfcfd] border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Medical Report Intelligence
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Laboratory values demystified, one marker at a time.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Medical report analysis is one key capability of Aegis. It helps you understand standard laboratory panels, reference ranges, and findings so you can hold meaningful conversations with your doctor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                  CBC
                </div>
                <h3 className="font-semibold text-slate-900 text-base">Complete Blood Count</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hemoglobin, hematocrit, WBC differential, and platelet counts explained alongside oxygen transport and immune health.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                  LFT
                </div>
                <h3 className="font-semibold text-slate-900 text-base">Liver Function Tests</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bilirubin, SGOT/AST, SGPT/ALT, and alkaline phosphatase demystified without jumping to premature conclusions.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  KFT
                </div>
                <h3 className="font-semibold text-slate-900 text-base">Kidney Function Tests</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Serum creatinine, blood urea nitrogen (BUN), and estimated GFR explained in relation to filtration and hydration.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                  THY
                </div>
                <h3 className="font-semibold text-slate-900 text-base">Thyroid Panels</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  TSH, Free T3, and Free T4 interpreted in context with energy levels, metabolism, and typical clinical reference brackets.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link href="/medical-reports" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline">
                Explore our comprehensive medical report guide <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 4: Symptom Organisation (OPQRST) */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Structured Symptom Understanding
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  Organizing symptoms with the OPQRST clinical framework.
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  When you visit a doctor, conveying when and how your symptoms occur is essential. Aegis guides you through the gold-standard OPQRST clinical framework to build an organized symptom timeline.
                </p>
                <div className="p-5 rounded-2xl bg-[#eef4ff] border border-[#dbeafe] text-xs text-blue-900 leading-relaxed">
                  <strong>Why OPQRST matters:</strong> Clinicians rely on structured symptom dimensions to differentiate conditions. By organizing these details beforehand, you help your doctor assess your situation faster and more thoroughly.
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/70 space-y-2">
                  <div className="font-bold text-blue-600 text-sm">O — Onset</div>
                  <h3 className="font-semibold text-slate-900 text-sm">When and How</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Did the symptom start suddenly or gradually? What activity were you doing when it began?
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/70 space-y-2">
                  <div className="font-bold text-blue-600 text-sm">P — Provocation / Palliation</div>
                  <h3 className="font-semibold text-slate-900 text-sm">Triggers &amp; Relief</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    What makes the symptom worse (movement, food, stress) and what makes it better (rest, medication)?
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/70 space-y-2">
                  <div className="font-bold text-blue-600 text-sm">Q — Quality</div>
                  <h3 className="font-semibold text-slate-900 text-sm">Sensation Character</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Is the sensation sharp, dull, burning, aching, throbbing, or cramping?
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/70 space-y-2">
                  <div className="font-bold text-blue-600 text-sm">R — Region &amp; Radiation</div>
                  <h3 className="font-semibold text-slate-900 text-sm">Location &amp; Spread</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Where exactly is the symptom located, and does it spread or radiate to other areas?
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/70 space-y-2">
                  <div className="font-bold text-blue-600 text-sm">S — Severity</div>
                  <h3 className="font-semibold text-slate-900 text-sm">Intensity Scale</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    How severe is the discomfort on a 1–10 scale, and how does it affect your everyday activities?
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/70 space-y-2">
                  <div className="font-bold text-blue-600 text-sm">T — Time &amp; Temporal Pattern</div>
                  <h3 className="font-semibold text-slate-900 text-sm">Duration &amp; Frequency</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    How long does each episode last? Is it constant, intermittent, or cyclical throughout the day?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Preparing for Care */}
        <section className="py-20 bg-[#fbfcfd] border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Doctor Consultation Preparation
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  Arrive at your consultation confident and prepared.
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Medical appointments are often brief, making it challenging to remember every detail or ask all the right questions. Aegis helps you organize your concerns, summarize relevant context, and prepare targeted question checklists for your healthcare provider.
                </p>
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
                    <ClipboardList className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Concise Clinical Summary</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        A structured synopsis of your symptoms, onset timeline, and recent lab results ready to share or reference.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
                    <Stethoscope className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Clinician Question Checklist</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Tailored, high-yield questions covering causes, follow-up tests, red flags to watch for, and lifestyle adjustments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-lg space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-slate-900 text-xs">Consultation Brief Generated</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Ready for Doctor Visit</span>
                  </div>

                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                      <strong>Chief Concern:</strong> Episodic right upper quadrant discomfort, onset 4 days ago, worsening post-prandially.
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                      <strong>Report Markers:</strong> Bilirubin 1.4 mg/dL (borderline elevated); SGPT 48 U/L.
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 space-y-1.5">
                      <strong className="block text-blue-950 font-semibold">Recommended Questions to Ask Doctor:</strong>
                      <p>1. &quot;Could an ultrasound be indicated to examine my gallbladder?&quot;</p>
                      <p>2. &quot;Should we repeat the liver panel in 4–6 weeks to observe the trajectory?&quot;</p>
                      <p>3. &quot;Are there dietary modifications that can relieve these post-meal symptoms?&quot;</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Safety and Escalation */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="max-w-3xl mx-auto space-y-6 text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                Safety and Escalation Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Deterministic emergency risk recognition.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Aegis features a deterministic safety layer designed to identify specified critical warning signs and direct users towards appropriate emergency care.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-[#fbfcfd] border border-amber-200/70 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900 text-base">Red-Flag Recognition</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Monitors for acute warning signs such as crushing chest pain radiating to the jaw/arm, sudden severe breathlessness, facial drooping, or unilateral weakness.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#fbfcfd] border border-amber-200/70 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900 text-base">Direct Urgent Escalation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Immediately halts conversational chat and directs users toward local emergency services (108 / 112 in India, 911 in the US) or the nearest emergency department.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#fbfcfd] border border-amber-200/70 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900 text-base">Clear Boundaries</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Aegis does not replace emergency response services or qualified emergency clinicians, nor does it guarantee that every possible medical emergency will be detected.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Privacy and Responsible Use */}
        <section className="py-20 bg-[#fbfcfd] border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Privacy &amp; Responsible Use
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  Patient context and continuity, with privacy at the core.
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  When you provide health context and past report history, Aegis uses that information strictly to deliver more coherent assistance during your session. Data safeguards ensure privacy, consent, and user control.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      <strong>Row-Level Isolation:</strong> Multi-tenant isolation in Supabase guarantees that your health records are accessible only by your authenticated account.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      <strong>Consent &amp; Privacy:</strong> Conversations are never sold, rented, or utilized for advertising networks.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      <strong>Responsible AI Safeguards:</strong> Non-diagnostic design ensuring patients are always directed toward licensed clinicians for definitive care.
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
                    <Shield className="h-4 w-4" />
                    <span>Protected Health Environment</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Patient-Centric Data Governance</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Aegis is built around patient agency. You control what information you upload or share, and you can clear your conversation records at any time. Context continuity is designed to assist you, not create lock-in.
                  </p>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>AES-256 Cloud Encryption</span>
                    <span className="font-mono text-emerald-600">Zero Commercial Tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: FAQs */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Everything you need to know about Aegis
              </h2>
            </div>

            <div className="space-y-4">
              {AEGIS_FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-2"
                >
                  <h3 className="font-semibold text-slate-900 text-base">{faq.question}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 9: Closing CTA */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 mx-auto">
              <span>HIPPOCRATES · AEGIS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Ready to understand your health with clarity?
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Explore health concerns, organize symptoms with OPQRST, demystify medical reports, and prepare for your next doctor consultation.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link href="/?persona=patient">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-medium text-sm shadow-md cursor-pointer">
                  Explore Aegis Now
                </Button>
              </Link>
              <Link href="/platform">
                <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white px-7 py-3.5 rounded-xl font-medium text-sm">
                  Discover HIPPOCRATES
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
