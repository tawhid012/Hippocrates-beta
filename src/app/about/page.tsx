"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { Sparkles, Award, GraduationCap, ArrowUpRight } from "lucide-react";

interface TeamMember {
  name: string;
  role: "Founder" | "Co-Founder" | "Project Guide";
  roleBadge: string;
  roleBadgeColor: string;
  tagline: string;
  description: string;
  imageSrc?: string;
  imageAlt: string;
  imagePositionClass?: string;
  isMentor?: boolean;
  initials?: string;
}

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

function TeamMemberCard({ member }: { member: TeamMember }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)] hover:border-slate-300 transition-all duration-300 flex flex-col overflow-hidden h-full">
      {/* Portrait Photo Container with Consistent Aspect Ratio */}
      <div className="relative aspect-[4/5] w-full bg-slate-100 overflow-hidden border-b border-slate-100">
        {!imageError && member.imageSrc && !member.isMentor ? (
          <Image
            src={member.imageSrc}
            alt={member.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover ${member.imagePositionClass || "object-center"} transition-transform duration-500 ease-out group-hover:scale-[1.025]`}
            onError={() => setImageError(true)}
            priority
          />
        ) : member.isMentor && !imageError && member.imageSrc ? (
          <div className="relative h-full w-full">
            <Image
              src={member.imageSrc}
              alt={member.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.025]"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          /* Dignified Academic Mentor Card Portrait Presentation */
          <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 via-slate-100/70 to-emerald-50/30 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
            
            <div className="relative z-10 flex flex-col items-center space-y-4">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-white border-2 border-emerald-200/90 shadow-sm flex items-center justify-center text-emerald-800 transition-transform duration-300 group-hover:scale-105">
                <GraduationCap className="h-12 w-12 sm:h-14 sm:w-14 text-emerald-700" strokeWidth={1.5} />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-block">
                  Academic Mentor
                </div>
                <p className="text-xs text-slate-500 font-medium pt-1">
                  National Children&apos;s Science Congress
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subtle Gradient Veil for Text Contrast */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none opacity-60" />
      </div>

      {/* Profile Details Container */}
      <div className="p-6 sm:p-7 flex flex-col flex-grow justify-between space-y-4 bg-white">
        <div className="space-y-2.5">
          {/* Role Pill & Sub-tag */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${member.roleBadgeColor}`}
            >
              {member.roleBadge}
            </span>
            <span className="text-[11px] font-medium text-slate-400 tracking-tight">
              {member.tagline}
            </span>
          </div>

          {/* Member Name */}
          <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
            {member.name}
          </h3>

          {/* Role Description */}
          <p className="text-sm text-slate-600 leading-relaxed pt-1">
            {member.description}
          </p>
        </div>

        {/* Card Footer Accent */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-500">NCSC Research Team</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <div>
        <PublicNavbar />

        {/* Hero Section */}
        <section className="pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#eef4ff] text-[#2563eb] border border-[#dbeafe]">
              <Sparkles className="h-3.5 w-3.5 text-[#2563eb]" />
              <span>About Hippocrates AI</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-slate-900 leading-[1.08]">
              Intelligent Care. Human First.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Hippocrates was founded on a simple yet ambitious premise: artificial intelligence can transform healthcare not by replacing human clinicians, but by empowering patients with clarity and supporting doctors with intelligent clinical synthesis.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Our Mission</span>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Making clinical intelligence accessible and safe.</h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Too often, patients leave consultations with unanswered questions, and doctors are burdened by mountains of paperwork and complex diagnostic analysis. Hippocrates provides a dual-engine architecture (Aegis for patients, Oracle for doctors) designed for compassionate care and clinical rigor.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <Link href="/">
                    <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-7 py-3 rounded-xl text-sm font-medium">
                      Launch Web App
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
                The people behind HIPPOCRATES and our effort to make health information more accessible.
              </p>
            </div>

            {/* Profile Cards Grid (3 Columns Desktop, 2 Tablet, 1 Mobile) */}
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
