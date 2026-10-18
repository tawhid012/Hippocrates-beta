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
  Mic,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Aegis — Patient-Focused Health Information & Guidance",
  description:
    "Explore Aegis by Hippocrates: a patient-focused assistant designed to help people understand health information, translate medical reports, and access appropriate health guidance.",
  keywords: [
    "Hippocrates Aegis",
    "Aegis health assistant",
    "patient health information",
    "medical report explanation",
    "understanding blood test reports",
    "preparing questions for a doctor",
    "accessible health awareness",
  ],
  alternates: {
    canonical: "/aegis",
  },
  openGraph: {
    title: "Aegis — Patient-Focused Health Information & Guidance",
    description:
      "Explore Aegis by Hippocrates: a patient-focused assistant designed to help people understand health information, translate medical reports, and access appropriate health guidance.",
    url: "/aegis",
    images: [
      {
        url: "/hippocrates-og.png",
        width: 1024,
        height: 536,
        alt: "Aegis by Hippocrates — Patient-Focused Health Information and Guidance",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aegis — Patient-Focused Health Information & Guidance",
    description:
      "Explore Aegis by Hippocrates: a patient-focused assistant designed to help people understand health information, translate medical reports, and access appropriate health guidance.",
    images: ["/hippocrates-og.png"],
  },
};

const AEGIS_FAQS = [
  {
    question: "What is Hippocrates Aegis?",
    answer:
      "Aegis is the patient-facing engine of the Hippocrates platform. It acts as an empathetic health assistant that helps you translate laboratory reports into plain English, organize your symptoms along clinical timelines, and prepare high-yield questions for your appointments with qualified doctors.",
  },
  {
    question: "Can Aegis give me a formal medical diagnosis?",
    answer:
      "No. Aegis is strictly an educational and communication-preparation tool. It does not provide medical diagnoses, prescribe treatments, or alter medications. All insights are designed to support your dialogue with a licensed medical professional.",
  },
  {
    question: "What happens if I enter an emergency symptom?",
    answer:
      "Aegis features deterministic emergency safety gates. If you enter severe red-flag symptoms—such as crushing chest pain, difficulty breathing, or acute neurological deficits—Aegis immediately halts conversational chat and directs you to contact local emergency services (108/112 in India, 911 in the US) or visit the nearest emergency facility.",
  },
  {
    question: "How does Aegis explain medical test reports?",
    answer:
      "You can paste or upload your laboratory reports (such as Complete Blood Count, Liver Function Tests, or Thyroid panels). Aegis breaks down each measured parameter, provides typical reference ranges, explains what the biological markers do, and suggests questions to ask your doctor about your specific numbers.",
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

        {/* Hero Section */}
        <section className="pt-8 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
                <HeartPulse className="h-3.5 w-3.5 text-[#2563eb]" />
                <span>Patient Health Intelligence • Powered by Hippocrates</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
                Understand your health. <br />
                <span className="text-blue-600">Without medical confusion.</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Aegis is your personal health assistant. Designed to feel like talking to a calm, attentive clinician during a consultation. No intimidating medical jargon, no panic—just structured clarity, lab test explanations, and targeted doctor visit preparation.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/?persona=patient">
                  <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-8 py-3.5 rounded-xl font-medium text-sm shadow-sm flex items-center gap-2 cursor-pointer">
                    <span>Talk to Aegis Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/medical-reports">
                  <Button variant="outline" className="border-slate-300 hover:bg-slate-50 text-slate-900 px-7 py-3.5 rounded-xl font-medium text-sm">
                    Medical Report Guide
                  </Button>
                </Link>
              </div>

              {/* Emergency Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Clinical Safety Notice:</strong> Aegis provides general health education and consultation preparation. It is not an emergency response system. For acute chest pain, shortness of breath, or emergency symptoms, call emergency services (108 / 112 / 911) immediately.
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
                    &quot;I reviewed the CBC test you entered. Your hemoglobin is noted at 11.2 g/dL, which is slightly below the standard adult female bracket of 12.0–15.5 g/dL. Have you noticed increased fatigue or dizziness recently?&quot;
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 ml-6">
                    &quot;Yes, especially during afternoon walks. What should I ask my doctor about this?&quot;
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-slate-700">
                    &quot;Here are 3 specific questions for your physician: 1) Should we test serum ferritin to check iron stores? 2) Could this explain my recent fatigue? 3) Do we need dietary adjustments or formal supplementation?&quot;
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

        {/* Feature Highlights */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Patient-Centered Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Designed to make healthcare understandable.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Four core ways Aegis empowers patients before, during, and after medical consultations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/70 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Lab Report Breakdown</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Clear explanations of CBC, lipid profiles, liver markers, and thyroid tests without confusing abbreviations or scary medical jargon.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/70 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Symptom Organization</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Structures your symptoms using clinical dimensions (onset, severity, frequency, triggers) so your doctor can diagnose you faster.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/70 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Doctor Visit Questions</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Generates customized, high-yield question checklists for your specific consultation so you never leave an appointment feeling unheard.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/70 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Mic className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Aegis Pro Voice</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Natural spoken conversations powered by ultra-low-latency voice AI. Speak naturally about your health concerns from any mobile browser.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-[#fcfdfe] border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Common Questions About Aegis
              </h2>
            </div>

            <div className="space-y-4">
              {AEGIS_FAQS.map((faq, idx) => (
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

        {/* CTA Banner */}
        <section className="py-16 bg-slate-900 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to understand your health with clarity?
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
              Try Aegis today for free. Experience calm, structured health conversations and prepare for your next clinician visit.
            </p>
            <div className="pt-2">
              <Link href="/?persona=patient">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-medium text-sm shadow-md cursor-pointer">
                  Launch Aegis Health Assistant
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
