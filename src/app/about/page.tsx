import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { TeamMemberCard, type TeamMember } from "@/components/about/TeamMemberCard";
import { JsonLd, getOrganizationJsonLd } from "@/components/seo/JsonLd";
import { Sparkles, Award, ArrowUpRight, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Hippocrates AI — Mission, Team & Project History",
  description:
    "Learn about Hippocrates AI: founded by Tawhidur Rahman Laskar and Ahmed Al-Ferdous under academic guidance from Abdul Basith Barbhuiya for the National Children's Science Congress (NCSC).",
  keywords: [
    "About Hippocrates AI",
    "Tawhidur Rahman Laskar",
    "Ahmed Al-Ferdous",
    "Abdul Basith Barbhuiya",
    "Hippocrates team",
    "NCSC scientific study",
    "healthcare AI research",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Hippocrates AI — Mission, Team & Project History",
    description:
      "The story, research mission, and team behind Hippocrates: dual-engine healthcare AI developed for the National Children's Science Congress.",
    url: "/about",
  },
};

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Tawhidur Rahman Laskar",
    role: "Founder",
    roleBadge: "Founder",
    roleBadgeColor: "bg-blue-50 text-blue-700 border-blue-200/80",
    tagline: "Architecture & System Lead",
    description:
      "Conceptualized and led the development of HIPPOCRATES, architecting its dual-engine clinical AI models and patient-facing conversational experience.",
    imageSrc: "/team/tawhidur-rahman-laskar.png",
    imageAlt: "Tawhidur Rahman Laskar — Founder of HIPPOCRATES",
    imagePositionClass: "object-[50%_24%]",
  },
  {
    name: "Ahmed Al-Ferdous",
    role: "Co-Founder",
    roleBadge: "Co-Founder",
    roleBadgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    tagline: "Research & Interface Co-Developer",
    description:
      "Co-developed the research framework, collaborating on clinical interface design, patient safety validation, and systematic testing.",
    imageSrc: "/team/ahmed-al-ferdous.png",
    imageAlt: "Ahmed Al-Ferdous — Co-Founder of HIPPOCRATES",
    imagePositionClass: "object-[50%_20%]",
  },
  {
    name: "Abdul Basith Barbhuiya",
    role: "Project Guide",
    roleBadge: "Project Guide",
    roleBadgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    tagline: "Academic Mentorship & Guidance",
    description:
      "Provided academic mentorship, methodological guidance, and continuous review throughout the development and scientific evaluation of the project.",
    imageSrc: "/team/abdul-basith-barbhuiya.png",
    imageAlt: "Abdul Basith Barbhuiya — Project Guide for HIPPOCRATES",
    isMentor: true,
    initials: "AB",
  },
];

export default function AboutPage() {
  const organizationJsonLd = getOrganizationJsonLd();

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <JsonLd schema={organizationJsonLd} />
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "About Hippocrates", href: "/about" }]} />

        {/* Hero Section */}
        <section className="pt-8 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
              <Sparkles className="h-3.5 w-3.5 text-[#2563eb]" />
              <span>About Hippocrates AI</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
              Intelligent Care. <br />
              <span className="text-blue-600">Human First.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Hippocrates was founded on a simple yet ambitious premise: artificial intelligence can transform healthcare not by attempting to replace human clinicians, but by empowering patients with clarity and supporting doctors with intelligent clinical synthesis.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Our Mission</span>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Making clinical intelligence accessible and safe.
                </h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Too often, patients leave consultations with unanswered questions, and doctors are burdened by mountains of documentation and high cognitive fatigue. Hippocrates provides a dual-engine architecture (Aegis for patients, Oracle for doctors) designed for compassionate care and clinical rigor.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <Link href="/?persona=patient">
                    <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-7 py-3 rounded-xl text-sm font-medium cursor-pointer">
                      <span>Launch Web App</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/safety">
                    <Button variant="outline" className="text-xs">
                      Clinical Safety Protocols
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200/80 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Core Principles</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Patient-First Safety</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Always transparent about AI limitations, encouraging in-person consultations when appropriate.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Clinical Rigor</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Built with multi-model intelligence that helps doctors evaluate differentials and lab findings rapidly.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Absolute Privacy</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Encrypted records and strict data stewardship protecting sensitive health conversations.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Meet the Team Section */}
        <section className="py-20 bg-[#f8fafc] border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            {/* Section Header */}
            <div className="max-w-2xl mx-auto text-center space-y-3.5 mb-14 sm:mb-16">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>NCSC Research Team</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                Meet the Team
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                The researchers and developers behind HIPPOCRATES and our effort to make health information more accessible.
              </p>
            </div>

            {/* Profile Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 items-stretch">
              {TEAM_MEMBERS.map((member) => (
                <TeamMemberCard key={member.name} member={member} />
              ))}
            </div>

            {/* Academic Credential & NCSC Congress Context Banner */}
            <div className="mt-14 sm:mt-16 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                <Award className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
              </div>
              <div className="space-y-1.5 flex-grow">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    National Children&apos;s Science Congress (NCSC)
                  </h3>
                  <span className="text-[11px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                    Scientific Study
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  HIPPOCRATES is developed as a student-led scientific investigation for the National Children&apos;s Science Congress, focusing on AI-assisted accessible health awareness, safe triage convergence, and doctor-patient collaborative tools.
                </p>
              </div>
              <div className="shrink-0 pt-2 sm:pt-0">
                <Link href="/platform">
                  <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs">
                    <span>Platform Overview</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
