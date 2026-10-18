import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Home, HeartPulse, Stethoscope, BookOpen } from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The requested page or medical resource could not be located on Hippocrates.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            HTTP 404 — Not Found
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              Page Not Found
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-lg mx-auto">
              The page, clinical resource, or consultation you are looking for has been moved, removed, or never existed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
            <Link
              href="/"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex items-start gap-3 group"
            >
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  Platform Home
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Explore clinical intelligence overview
                </div>
              </div>
            </Link>

            <Link
              href="/aegis"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex items-start gap-3 group"
            >
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
                  Aegis for Patients
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Report explainer and health guidance
                </div>
              </div>
            </Link>

            <Link
              href="/oracle"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex items-start gap-3 group"
            >
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                  Oracle for Doctors
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Clinical decision support for verified physicians
                </div>
              </div>
            </Link>

            <Link
              href="/knowledge"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex items-start gap-3 group"
            >
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                  Knowledge Hub
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Educational guides on lab tests and AI safety
                </div>
              </div>
            </Link>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Hippocrates Homepage
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
