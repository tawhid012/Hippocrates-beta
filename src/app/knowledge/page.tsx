import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { KNOWLEDGE_ARTICLES } from "@/data/knowledgeArticles";
import {
  BookOpen,
  Clock,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Knowledge Hub — Medically Reviewed Clinical & Health Guides",
  description:
    "Evidence-based healthcare education: understand Complete Blood Count (CBC) tests, thyroid panels, doctor consultation preparation, and responsible clinical AI.",
  keywords: [
    "Hippocrates knowledge hub",
    "understanding blood test reports",
    "how to understand CBC reports",
    "how to understand thyroid reports",
    "preparing questions for a doctor",
    "responsible AI in healthcare",
    "clinical decision support software",
  ],
  alternates: {
    canonical: "/knowledge",
  },
  openGraph: {
    title: "Knowledge Hub — Medically Reviewed Clinical & Health Guides",
    description:
      "Explore high-quality, medically referenced articles on laboratory test interpretation, clinician consultation tips, and healthcare AI safety.",
    url: "/knowledge",
  },
};

export default function KnowledgeHubPage() {
  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "Knowledge Hub", href: "/knowledge" }]} />

        {/* Hero Section */}
        <section className="pt-8 sm:pt-16 pb-12 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
              <BookOpen className="h-3.5 w-3.5 text-[#2563eb]" />
              <span>Evidence-Grounded Healthcare Education</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
              Hippocrates <br />
              <span className="text-blue-600">Knowledge Hub.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Reviewed, clear, and trustworthy educational resources designed to dismantle medical jargon for patients and evaluate clinical decision-support architectures for healthcare professionals.
            </p>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-12 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Latest Medically Reviewed Guides ({KNOWLEDGE_ARTICLES.length})
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Reviewed under Clinical Safety Protocol</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {KNOWLEDGE_ARTICLES.map((article) => {
                const isPatient = article.category === "Patient Education";
                const isDoctor = article.category === "Doctor Workflows";

                return (
                  <article
                    key={article.slug}
                    className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                            isPatient
                              ? "bg-blue-50 text-blue-700 border-blue-200/70"
                              : isDoctor
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200/70"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                          }`}
                        >
                          {isPatient && <HeartPulse className="h-3 w-3" />}
                          {isDoctor && <Stethoscope className="h-3 w-3" />}
                          <span>{article.category}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{article.readingTime}</span>
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                        <Link href={`/knowledge/${article.slug}`}>{article.title}</Link>
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {article.description}
                      </p>

                      <div className="space-y-1.5 pt-2">
                        {article.summaryPoints.slice(0, 2).map((point, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-500">
                            <span className="text-blue-500 font-bold">•</span>
                            <span className="line-clamp-2">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">
                        <span>Updated {article.dateModified}</span>
                      </div>
                      <Link
                        href={`/knowledge/${article.slug}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                      >
                        <span>Read Guide</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
