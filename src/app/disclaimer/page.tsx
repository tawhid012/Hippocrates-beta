import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Medical & Clinical Disclaimer — Hippocrates AI",
  description:
    "Important medical and legal disclaimer regarding the use of the Hippocrates platform, Aegis health assistant, and Oracle clinical copilot.",
  keywords: [
    "Hippocrates medical disclaimer",
    "healthcare AI liability",
    "clinical decision support disclaimer",
    "not medical advice notice",
  ],
  alternates: {
    canonical: "/disclaimer",
  },
  openGraph: {
    title: "Medical & Clinical Disclaimer — Hippocrates AI",
    description:
      "Important medical disclosure: Hippocrates provides general health education and physician decision support; it does not provide autonomous medical diagnoses or emergency services.",
    url: "/disclaimer",
  },
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "Medical Disclaimer", href: "/disclaimer" }]} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              <span>Mandatory Healthcare Advisory</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
              Medical &amp; Clinical Disclaimer
            </h1>
            <p className="text-sm text-slate-500">
              Last Updated &amp; Clinically Reviewed: October 17, 2026
            </p>
          </div>

          {/* Emergency Alert Box */}
          <div className="p-6 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-950 space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2 text-rose-700">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              <span>EMERGENCY MEDICAL ADVISORY</span>
            </h2>
            <p className="text-sm leading-relaxed">
              <strong>DO NOT USE THIS PLATFORM FOR MEDICAL EMERGENCIES.</strong> If you or someone you are assisting is experiencing severe chest pain, sudden shortness of breath, acute neurological weakness or facial drooping (signs of stroke), profound bleeding, severe allergic reactions, or acute psychiatric distress, immediately contact your local emergency response service (such as <strong>108 / 112</strong> in India, <strong>911</strong> in the United States, <strong>999</strong> in the United Kingdom) or proceed without delay to the nearest hospital emergency room.
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed space-y-6 text-slate-700">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">1. Nature of the Service</h2>
              <p>
                Hippocrates AI (including its dual engines, <strong>Aegis</strong> and <strong>Oracle</strong>) is an informational, educational, and cognitive decision-support software platform. It is designed to foster health literacy for patients and assist verified medical doctors in organizing clinical reasoning and documentation.
              </p>
              <p>
                <strong>The platform does not provide formal medical diagnoses, clinical prognosis, or personalized pharmacological prescriptions.</strong> The software operates as an assistive intelligence tool and must never be regarded as a substitute for professional clinical evaluation, diagnosis, or treatment by a qualified and licensed healthcare provider.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">2. No Doctor-Patient Relationship Established</h2>
              <p>
                Use of the Hippocrates platform, interaction with conversational assistants (including Aegis and Aegis Pro Voice), and generation of medical report summaries do not create a doctor-patient, therapist-patient, or confidential fiduciary relationship between you and Hippocrates AI, its developers, or its affiliates.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">3. Role and Boundaries for Patients (Aegis)</h2>
              <p>
                Aegis is calibrated to assist patients in:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Exploring health concerns conversationally and clarifying medical information in accessible language.</li>
                <li>Understanding laboratory test reports (CBC, LFT, KFT, thyroid panels) and reference intervals.</li>
                <li>Structuring historical symptom timelines and characteristics using the OPQRST clinical framework.</li>
                <li>Compiling targeted question lists to facilitate productive discussions during in-person clinician visits.</li>
                <li>Identifying critical red-flag emergency symptoms deterministically and directing users toward immediate emergency care.</li>
              </ul>
              <p>
                You must never delay, disregard, or avoid seeking qualified medical advice because of information presented by Aegis. Always review lab reports and symptoms directly with your treating physician.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">4. Role and Boundaries for Physicians (Oracle)</h2>
              <p>
                Oracle is intended strictly as a clinical decision support tool (CDSS) for verified licensed clinicians. It provides evidence synthesis, differential checklist expansion, and administrative documentation formatting.
              </p>
              <p>
                <strong>Independent Clinical Responsibility:</strong> The licensed clinician retains full, unmitigated legal, ethical, and clinical responsibility for all diagnostic decisions, clinical interventions, medication orders, and patient management plans. Oracle outputs must be critically verified by the physician against direct clinical findings and current institutional guidelines.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">5. Laboratory Test Reports</h2>
              <p>
                Laboratory report interpretations provided by the platform are educational approximations based on standard adult reference intervals. Because biological reference brackets, calibration standards, and reagents differ across laboratories, all test results must be reviewed with the prescribing or treating clinician alongside your physical exam.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">6. Limitation of Liability</h2>
              <p>
                Under no circumstances shall Hippocrates AI, its creators, guides, or contributors be held liable for any direct, indirect, incidental, consequential, special, or exemplary damages arising out of or in connection with your reliance upon or use of information generated by the platform.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-wrap gap-4">
            <Link href="/terms">
              <Button variant="outline" className="text-xs">
                Review Terms of Service
              </Button>
            </Link>
            <Link href="/privacy">
              <Button variant="outline" className="text-xs">
                Review Privacy Practices
              </Button>
            </Link>
            <Link href="/safety">
              <Button variant="outline" className="text-xs">
                Clinical Safety Protocols
              </Button>
            </Link>
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}
