import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Shield, Lock, FileCheck, Database, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy & Clinical Data Practices — Hippocrates AI",
  description:
    "Comprehensive disclosure of Hippocrates data collection, cryptographic storage, retention, row-level security isolation, and deletion rights.",
  keywords: [
    "Hippocrates privacy policy",
    "healthcare AI data security",
    "clinical data protection",
    "HIPAA NDHM data privacy",
    "encrypted medical AI platform",
  ],
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy & Clinical Data Practices — Hippocrates AI",
    description:
      "Strict data stewardship: zero health data monetization, end-to-end encryption in transit and at rest, and full user deletion controls.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "Privacy Policy", href: "/privacy" }]} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 space-y-10">
          <div className="space-y-4 border-b border-slate-200/80 pb-8">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
              <Shield className="h-3.5 w-3.5 text-[#2563eb]" />
              <span>Verified Data Protection &amp; Privacy Practices</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
              Privacy Policy &amp; Data Practices
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              Last Updated &amp; Verified: October 17, 2026 • Hippocrates AI Platform
            </p>
          </div>

          <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
            {/* Principle 1 */}
            <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                <span>1. Cryptographic Storage &amp; Encryption Architecture</span>
              </h2>
              <p>
                Hippocrates processes consultation transcripts, symptom descriptions, and attached diagnostic laboratory reports strictly to deliver real-time clinical intelligence.
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
                <li><strong>In Transit:</strong> All data transmitted between your browser and our infrastructure is secured using industry-standard <strong>TLS 1.3</strong> encryption.</li>
                <li><strong>At Rest:</strong> Consultation records, user sessions, and stored summaries are encrypted at rest using <strong>AES-256</strong>.</li>
                <li><strong>Database Isolation:</strong> Multi-tenant isolation is enforced via Supabase PostgreSQL Row-Level Security (RLS) policies, mathematically preventing User A from querying or modifying User B&apos;s records.</li>
              </ul>
            </div>

            {/* Principle 2 */}
            <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-600" />
                <span>2. Information We Collect</span>
              </h2>
              <p>
                We only collect data necessary to provide and secure the clinical intelligence platform:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
                <li><strong>Account Credentials:</strong> Full name, verified email address, or phone number used during authentication.</li>
                <li><strong>Clinician Verification Data:</strong> For doctors accessing Oracle, we collect and verify the Medical Council Registration Number.</li>
                <li><strong>Clinical Consultation Content:</strong> The text of messages, symptom timelines, and lab parameters you voluntarily provide within a consultation case.</li>
                <li><strong>Technical Logs:</strong> IP address, browser user-agent, and error logs collected strictly for security, rate-limiting, and abuse prevention.</li>
              </ul>
            </div>

            {/* Principle 3 */}
            <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span>3. Zero Commercial Ad Monetization</span>
              </h2>
              <p>
                <strong>We never sell, rent, broker, or monetize your health data.</strong> Your medical discussions, symptom histories, and diagnostic lab reports are never provided to commercial advertising networks, data brokers, or insurance underwriters.
              </p>
            </div>

            {/* Principle 4 */}
            <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-blue-600" />
                <span>4. User Control &amp; Data Deletion Rights</span>
              </h2>
              <p>
                You retain complete sovereignty over your data:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
                <li><strong>Immediate Case Deletion:</strong> You can delete any individual consultation or case history directly from the workspace sidebar with one click. Deletion removes the case from both in-memory caches and PostgreSQL databases.</li>
                <li><strong>Account Eradication:</strong> You may request complete account deletion and data scrubbing by contacting our data protection officer at <code>support@hippocrates.in</code>.</li>
              </ul>
            </div>

            {/* Principle 5 */}
            <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200/80 space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>5. Regulatory Alignment</span>
              </h2>
              <p>
                Hippocrates is engineered in contemplation of the Indian Digital Personal Data Protection Act (DPDP), the National Digital Health Mission (NDHM) guidelines, and standard international health data security principles (HIPAA Security Rule principles).
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-wrap gap-4">
            <Link href="/terms">
              <Button variant="outline" className="text-xs">
                Terms of Service
              </Button>
            </Link>
            <Link href="/disclaimer">
              <Button variant="outline" className="text-xs">
                Medical Disclaimer
              </Button>
            </Link>
            <Link href="/safety">
              <Button variant="outline" className="text-xs">
                Safety Principles
              </Button>
            </Link>
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}
