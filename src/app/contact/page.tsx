import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ContactForm } from "@/components/contact/ContactForm";
import { SITE_CONFIG } from "@/config/site";
import { Sparkles, Mail, Building, MapPin, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — Clinical Inquiries & Support — Hippocrates AI",
  description:
    "Get in touch with the Hippocrates AI team for patient support, doctor registration inquiries, clinical research collaborations, and platform feedback.",
  keywords: [
    "Contact Hippocrates",
    "Hippocrates AI support",
    "doctor registration support",
    "clinical AI inquiry",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us — Clinical Inquiries & Support — Hippocrates AI",
    description:
      "Reach out to the Hippocrates AI team for technical support, clinician onboarding, and scientific collaborations.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "Contact Us", href: "/contact" }]} />

        {/* Hero & Contact Section */}
        <section className="pt-8 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
                <Sparkles className="h-3.5 w-3.5 text-[#2563eb]" />
                <span>Get in Touch</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
                We are here to help.
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Have questions about Hippocrates, Aegis, or Oracle clinical integrations? Reach out to our team and we will respond promptly.
              </p>

              <div className="space-y-4 pt-4 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">General &amp; Support Email</span>
                    <a
                      href={`mailto:${SITE_CONFIG.contact.supportEmail}`}
                      className="text-blue-600 hover:underline"
                    >
                      {SITE_CONFIG.contact.supportEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Clinical Inquiries</span>
                    <a
                      href={`mailto:${SITE_CONFIG.contact.clinicalInquiries}`}
                      className="text-blue-600 hover:underline"
                    >
                      {SITE_CONFIG.contact.clinicalInquiries}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Region</span>
                    <span className="text-slate-500">{SITE_CONFIG.contact.location}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Advisory Callout */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 mt-6">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Urgent Clinical Note:</strong> This contact form and our support inboxes are not monitored for emergency medical triage. If you are experiencing acute medical distress, dial 108/112/911 immediately.
                </div>
              </div>
            </div>

            {/* Contact Form Card */}
            <div className="lg:col-span-7">
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/80 shadow-xl">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
