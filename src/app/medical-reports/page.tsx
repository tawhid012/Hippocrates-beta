import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { JsonLd, getMedicalWebPageJsonLd, getFaqJsonLd } from "@/components/seo/JsonLd";
import {
  FileText,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Understanding Medical Reports & Blood Tests — Educational Guide",
  description:
    "Learn how to understand your blood test reports: Complete Blood Count (CBC), Lipid Profile, Thyroid Panel, Liver & Kidney Function Tests. Demystifying laboratory reference ranges.",
  keywords: [
    "understanding blood test reports",
    "medical report explanation",
    "how to understand CBC reports",
    "how to understand thyroid reports",
    "medical terminology explained",
    "lab test reference ranges",
    "hemoglobin normal values",
    "liver function test explained",
  ],
  alternates: {
    canonical: "/medical-reports",
  },
  openGraph: {
    title: "Understanding Medical Reports & Blood Tests — Educational Guide",
    description:
      "A comprehensive, patient-friendly guide to understanding blood tests and laboratory reports with clarity. Evidence-based healthcare education from Hippocrates.",
    url: "/medical-reports",
  },
};

const REPORT_FAQS = [
  {
    question: "Why do reference ranges differ between different diagnostic laboratories?",
    answer:
      "Reference ranges are determined by testing large cohorts of healthy individuals on specific automated analyzers and analytical reagents. Because equipment calibration, testing methods, and population demographics vary by laboratory, normal reference brackets can differ slightly between testing facilities.",
  },
  {
    question: "Does an abnormal lab value mean I have a disease?",
    answer:
      "Not necessarily. Approximately 5% of healthy individuals will naturally test slightly outside standard reference intervals for any given marker. Clinicians evaluate individual numbers in the context of your overall symptoms, physical exam, medication history, and past baseline trends.",
  },
  {
    question: "How can Hippocrates Aegis help me with my test results?",
    answer:
      "Medical report intelligence is one capability within Aegis, the patient-facing AI assistant. Aegis explains laboratory abbreviations in plain language, breaks down biological markers, contextualizes reference intervals, and helps formulate informed questions to discuss with your doctor. It does not provide medical diagnoses or replace clinical consultations.",
  },
];

export default function MedicalReportsPage() {
  const medicalWebPageJsonLd = getMedicalWebPageJsonLd({
    title: "Understanding Medical Reports & Blood Tests — Educational Guide",
    description:
      "Educational guide to laboratory blood test reports: CBC, Metabolic Panels, Thyroid, Liver, and Kidney Function Tests.",
    url: "/medical-reports",
    aspect: "Diagnostic Laboratory Education",
    citations: [
      "National Institutes of Health (NIH) — MedlinePlus Lab Tests",
      "World Health Organization (WHO) Diagnostic Guidelines",
      "Indian Council of Medical Research (ICMR) Standard Laboratory Reference Protocols",
    ],
  });

  const faqJsonLd = getFaqJsonLd(REPORT_FAQS);

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <JsonLd schema={[medicalWebPageJsonLd, faqJsonLd]} />
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "Medical Report Education", href: "/medical-reports" }]} />

        {/* Hero Section */}
        <section className="pt-8 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
              <FileText className="h-3.5 w-3.5 text-[#2563eb]" />
              <span>Evidence-Based Laboratory Education</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
              Demystifying your <br />
              <span className="text-blue-600">medical test reports.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              When laboratory printouts arrive filled with unfamiliar abbreviations, units, and out-of-range flags, it is easy to feel overwhelmed. As part of HIPPOCRATES Aegis—the comprehensive patient-facing AI assistant—medical report intelligence helps you explore test parameters, understand reference ranges, and prepare meaningful questions for your doctor.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/?persona=patient">
                <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-8 py-3.5 rounded-xl font-medium text-sm shadow-sm flex items-center gap-2 cursor-pointer">
                  <span>Explore Reports with Aegis</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/knowledge/understanding-cbc-blood-test">
                <Button variant="outline" className="border-slate-300 hover:bg-slate-50 text-slate-900 px-7 py-3.5 rounded-xl font-medium text-sm">
                  Deep Dive: CBC Guide
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Core Blood Test Panels Breakdown */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Common Diagnostic Panels
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                What do standard blood tests measure?
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                An overview of the primary cellular, metabolic, and hormonal panels routinely ordered by clinicians.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* CBC Panel */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  CBC
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Complete Blood Count (CBC)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Measures the cellular components of blood:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li><strong>Hemoglobin &amp; Hematocrit:</strong> Oxygen-carrying capacity. Low levels suggest anemia.</li>
                  <li><strong>White Blood Cells (WBC):</strong> Immune defense cells. Elevated levels often reflect infection or inflammation.</li>
                  <li><strong>Platelets:</strong> Blood clotting cells. Abnormal values relate to bleeding or clotting tendencies.</li>
                  <li><strong>MCV &amp; MCH:</strong> Cell size and weight, helping classify types of anemia.</li>
                </ul>
                <div className="pt-2">
                  <Link href="/knowledge/understanding-cbc-blood-test" className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">
                    <span>Read full CBC breakdown guide</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Lipid Panel */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  LIP
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Lipid Profile (Cholesterol)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Evaluates circulating fats and cardiovascular risk indicators:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li><strong>Total Cholesterol:</strong> Overall sum of circulating blood cholesterol.</li>
                  <li><strong>HDL (&quot;Good&quot; Cholesterol):</strong> Helps remove excess cholesterol from arterial walls.</li>
                  <li><strong>LDL (&quot;Bad&quot; Cholesterol):</strong> Can accumulate in blood vessels, forming plaques.</li>
                  <li><strong>Triglycerides:</strong> Blood fats linked to diet, physical activity, and metabolic health.</li>
                </ul>
              </div>

              {/* Thyroid Panel */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  TFT
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Thyroid Profile (TSH, FT3, FT4)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Monitors the metabolic thermostat governed by the thyroid gland:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li><strong>TSH (Thyroid Stimulating Hormone):</strong> Signal from the pituitary. High TSH often indicates hypothyroidism.</li>
                  <li><strong>Free T4 &amp; Free T3:</strong> The active circulating thyroid hormones regulating energy and metabolism.</li>
                </ul>
                <div className="pt-2">
                  <Link href="/knowledge/understanding-thyroid-panels" className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">
                    <span>Read full Thyroid panel guide</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Liver Function Tests */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  LFT
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Liver Function Tests (LFT)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Screens for hepatic inflammation, bile duct clearance, and protein synthesis:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li><strong>SGOT (AST) &amp; SGPT (ALT):</strong> Cellular enzymes released during liver cell stress or inflammation.</li>
                  <li><strong>Bilirubin:</strong> Byproduct of normal red cell breakdown; elevation can cause jaundice.</li>
                  <li><strong>Alkaline Phosphatase (ALP):</strong> Enzyme associated with bile ducts and bone turnover.</li>
                </ul>
              </div>

              {/* Kidney Function Tests */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  KFT
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Kidney Function Tests (KFT / RFT)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Evaluates renal filtration efficacy and electrolyte equilibrium:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li><strong>Serum Creatinine:</strong> Muscle breakdown waste filtered by kidneys. High levels suggest decreased filtration.</li>
                  <li><strong>eGFR:</strong> Estimated Glomerular Filtration Rate, calculating kidney filtering capacity.</li>
                  <li><strong>Blood Urea / BUN:</strong> Protein breakdown waste filtered by kidneys.</li>
                </ul>
              </div>

              {/* Glycemic Markers */}
              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  GLU
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Glucose &amp; Glycated Hemoglobin (HbA1c)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Assesses blood sugar regulation over short and medium time horizons:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li><strong>Fasting Blood Glucose:</strong> Blood sugar level measured after an 8–12 hour overnight fast.</li>
                  <li><strong>HbA1c:</strong> The percentage of hemoglobin coated with sugar, reflecting your average glucose over the preceding 2–3 months.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Golden Rules for Reading Lab Reports */}
        <section className="py-16 bg-[#fcfdfe] border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Clinical Principles
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                4 Golden Rules When Reviewing Lab Results
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                <h3 className="font-semibold text-slate-900 text-base">1. Treat the Patient, Not Just the Number</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  A laboratory number never exists in a vacuum. A value slightly outside the reference interval can be completely harmless if you have no symptoms, while a value technically inside normal limits might still require medical attention if you are experiencing severe symptoms.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                <h3 className="font-semibold text-slate-900 text-base">2. Check the Specific Laboratory Reference Bracket</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Never compare your test result to numbers found on random online forums without checking the exact reference intervals printed in the adjacent column of your personal lab sheet.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                <h3 className="font-semibold text-slate-900 text-base">3. Look for Trends Across Time</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  A single test provides only an instantaneous snapshot. Clinicians gain far more insight from comparative trajectories over 3 to 12 months than from an isolated reading.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                <h3 className="font-semibold text-slate-900 text-base">4. Avoid Abrupt Self-Medication</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Never start, discontinue, or adjust prescription pharmaceuticals or high-dose nutritional supplements based solely on an automated printout without a physician&apos;s guidance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Frequently Asked Questions About Lab Reports
              </h2>
            </div>

            <div className="space-y-4">
              {REPORT_FAQS.map((faq, idx) => (
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

        {/* Disclaimer Banner */}
        <section className="py-12 bg-slate-100 border-t border-slate-200 text-slate-600 text-xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-2">
            <p className="font-semibold text-slate-800">Educational Disclaimer</p>
            <p>
              This educational guide is provided for informational and literacy purposes only and does not constitute medical advice, diagnosis, or clinical management. Always consult a qualified medical physician to interpret your diagnostic laboratory reports.
            </p>
          </div>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
