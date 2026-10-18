"use client";

import { useState } from "react";
import Image from "next/image";
import { GraduationCap } from "lucide-react";

export interface TeamMember {
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

export function TeamMemberCard({ member }: { member: TeamMember }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)] hover:border-slate-300 transition-all duration-300 flex flex-col overflow-hidden h-full">
      {/* Portrait Photo Container */}
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
          <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 via-slate-100/70 to-emerald-50/30 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
            <div className="relative z-10 flex flex-col items-center space-y-4">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-white border-2 border-emerald-200/90 shadow-sm flex items-center justify-center text-emerald-800 transition-transform duration-300 group-hover:scale-105">
                <GraduationCap className="h-12 w-12 sm:h-14 sm:w-14 text-emerald-700" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Academic Mentor
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Details */}
      <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${member.roleBadgeColor}`}>
              {member.roleBadge}
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {member.name}
          </h3>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            {member.tagline}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
            {member.description}
          </p>
        </div>
      </div>
    </div>
  );
}
