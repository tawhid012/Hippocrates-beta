"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Download,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Info,
  Apple,
  ExternalLink,
  FileCode,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppDownloadClientProps {
  apkFileName: string;
  apkSizeFormatted: string;
  apkSizeBytes: number;
  apkSha256: string;
  packageName: string;
  versionName: string;
}

export function AppDownloadClient({
  apkFileName,
  apkSizeFormatted,
  apkSizeBytes,
  apkSha256,
  packageName,
  versionName,
}: AppDownloadClientProps) {
  const [mounted, setMounted] = useState(false);
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "desktop">("desktop");
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const ua = navigator.userAgent || "";
    if (/android/i.test(ua)) {
      setDeviceType("android");
    } else if (/iPad|iPhone|iPod/.test(ua)) {
      setDeviceType("ios");
    } else {
      setDeviceType("desktop");
    }
  }, []);

  const handleDownloadClick = () => {
    setDownloadStarted(true);
  };

  const handleCopySha = async () => {
    try {
      await navigator.clipboard.writeText(apkSha256);
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2500);
    } catch {
      // Fallback
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: "How do I install Hippocrates on Android?",
      a: "Tap the 'Download for Android' button above to download the APK (4.88 MB). Once downloaded, swipe down your notification shade or open your browser's Downloads folder and tap HIPPOCRATES.apk. If Android prompts you that installation from this source is blocked, tap Settings, enable 'Allow from this source', then return to the installation screen and tap Install.",
    },
    {
      q: "Why does Android ask me to allow installation from unknown apps?",
      a: "Android displays a standard precautionary prompt for any application downloaded outside the Google Play Store. This is an expected security feature of the Android operating system. Hippocrates is an independent direct release from our official website (www.hippocrates.in). You do not need to disable Google Play Protect; simply grant one-time permission for your browser to complete the package installation.",
    },
    {
      q: "What should I do if the APK does not install or says 'App not installed'?",
      a: "First, verify that your device has at least 50 MB of available storage space. Second, ensure that any older or conflicting test version of the app is uninstalled. Third, make sure the download completed fully (file size should be 4.88 MB / 5,115,229 bytes). If the issue persists, you can instantly use Hippocrates via your web browser with zero installation.",
    },
    {
      q: "How do I update Hippocrates in the future?",
      a: "Because Hippocrates utilizes a hybrid native shell connected to our secure cloud engines, clinical updates, model improvements, and medical guidelines refresh automatically in the cloud without requiring a manual APK reinstall. For major native shell releases, we will publish updated APK files directly to this official download page.",
    },
    {
      q: "Is Hippocrates a replacement for a doctor?",
      a: "No. Hippocrates is strictly an educational healthcare intelligence and clinical-support platform. Aegis helps patients organize symptoms and understand lab reports to facilitate better doctor appointments. Oracle assists verified physicians with differential reasoning and documentation. Neither engine provides definitive medical diagnoses or replaces professional human clinical judgment.",
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* HERO SECTION — Apple-inspired Minimalist Showcase */}
      <section className="pt-6 sm:pt-12 pb-8 sm:pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Actions, Device Context */}
          <div className="lg:col-span-7 space-y-6">
            {/* Release Indicator */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              <Smartphone className="h-3.5 w-3.5 text-blue-600" />
              <span>Official Android Release • Direct APK</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-bold tracking-[-0.04em] text-slate-900 leading-[1.05]">
              Hippocrates, <br />
              <span className="text-blue-600">wherever you go.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl font-normal">
              Explore Hippocrates on your Android device for convenient access to its available health-information and clinical-support features.
            </p>

            {/* Device-Specific Context Banner (client-only after mount to prevent hydration mismatch) */}
            {mounted && deviceType === "android" && (
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-900 animate-in fade-in duration-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block">Android device detected</span>
                  <span>Tap below to download the official APK directly to your phone.</span>
                </div>
              </div>
            )}

            {mounted && deviceType === "ios" && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700 animate-in fade-in duration-300">
                <Apple className="h-4 w-4 text-slate-800 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block text-slate-900">Visiting on Apple iPhone / iPad</span>
                  <span>
                    Android APK packages cannot be installed on iOS. However, you can use Hippocrates right now as a full-screen Progressive Web App via Safari without downloading an APK.
                  </span>
                  <div className="pt-1">
                    <a href="#pwa-guide" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                      <span>View iOS Safari installation guide</span>
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {mounted && deviceType === "desktop" && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600 animate-in fade-in duration-300">
                <Info className="h-4 w-4 text-slate-500 shrink-0" />
                <span>
                  Visiting on desktop? You can download the APK file now and transfer it to your Android device, or open this page directly on your phone.
                </span>
              </div>
            )}

            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <a
                href={`/${apkFileName}`}
                download="Hippocrates.apk"
                onClick={handleDownloadClick}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group"
              >
                <Download className="h-5 w-5 text-white group-hover:translate-y-0.5 transition-transform" />
                <span>Download for Android</span>
                <span className="text-xs text-slate-300 font-normal">({apkSizeFormatted})</span>
              </a>

              <Link
                href="/"
                className="border border-slate-300 hover:bg-slate-50 text-slate-800 px-7 py-4 rounded-2xl text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Explore Hippocrates</span>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Post-Download Initiation Guidance */}
            {downloadStarted && (
              <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 space-y-2 text-xs text-blue-900 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 font-semibold text-blue-800">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Download Initiated</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Your browser is downloading <strong>{apkFileName}</strong> ({apkSizeFormatted}). When finished, swipe down your notifications or open Downloads and tap the APK to install.
                </p>
                <div className="pt-1">
                  <a href="#install-guide" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                    <span>Having trouble installing? View step-by-step instructions</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Quick Specs Micro-row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Official Website Release</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span>Universal Android APK</span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span>Package: {packageName}</span>
            </div>
          </div>

          {/* Right Column: Photorealistic Android Device Showcase */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[400px] flex items-center justify-center">
              <Image
                src="/hippocrates-android-device.jpg"
                alt="Hippocrates Android Mobile Experience"
                width={500}
                height={500}
                className="w-full h-auto object-contain rounded-3xl drop-shadow-[0_25px_50px_rgba(15,23,42,0.18)] select-none hover:scale-[1.02] transition-transform duration-500"
                priority
              />

              {/* Floating Verified Badge */}
              <div className="absolute -bottom-4 left-2 sm:-left-4 bg-white/95 backdrop-blur-md border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Verified APK Release</p>
                  <p className="text-[10px] text-slate-500 font-medium">v1.0.0 • 4.88 MB • ai.hippocrates.app</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VERIFIED RELEASE & FILE DETAILS SECTION */}
      <section className="py-12 bg-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Technical Specifications
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Verified Package Details
            </h2>
            <p className="text-sm text-slate-600">
              All package metrics are calculated directly from the official APK binary served from this domain.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Platform</span>
              <p className="text-sm sm:text-base font-bold text-slate-900">Android</p>
              <p className="text-[11px] text-slate-500">{versionName} • Universal</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Package ID</span>
              <p className="text-sm sm:text-base font-bold text-slate-900 truncate" title={packageName}>
                {packageName}
              </p>
              <p className="text-[11px] text-slate-500">Standalone App</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">File Size</span>
              <p className="text-sm sm:text-base font-bold text-slate-900">{apkSizeFormatted}</p>
              <p className="text-[11px] text-slate-500">{apkSizeBytes.toLocaleString()} bytes</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Distribution</span>
              <p className="text-sm sm:text-base font-bold text-slate-900">Official Direct</p>
              <p className="text-[11px] text-slate-500">www.hippocrates.in</p>
            </div>
          </div>

          {/* Expandable Technical Checksum Drawer */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileCode className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-900">SHA-256 Cryptographic Checksum</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTechDetails(!showTechDetails)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showTechDetails ? "Hide verification steps" : "How to verify checksum"}</span>
                {showTechDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto">
              <span className="select-all break-all flex-1">{apkSha256}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopySha}
                className="h-7 px-2.5 text-xs text-slate-600 hover:text-slate-900 shrink-0 cursor-pointer"
                title="Copy SHA-256 Hash"
              >
                {copiedSha ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="ml-1 text-[11px]">{copiedSha ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            {showTechDetails && (
              <div className="pt-2 text-xs text-slate-600 space-y-2 border-t border-slate-200/70">
                <p>
                  You can independently verify the downloaded APK binary integrity on your computer using terminal:
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] select-all">
                  shasum -a 256 {apkFileName}
                </div>
                <p className="text-[11px] text-slate-500">
                  The computed hash must match the value above character-for-character to ensure the binary has not been altered or tampered with.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* STEP-BY-STEP INSTALLATION GUIDE SECTION */}
      <section id="install-guide" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 scroll-mt-24 space-y-12">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Installation Walkthrough
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            How to Install Hippocrates on Android
          </h2>
          <p className="text-sm text-slate-600">
            Follow these simple steps to install the APK package on any modern Android device.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 relative">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-base text-slate-900">Download the APK</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tap <strong>Download for Android</strong> above. Your browser will download the 4.88 MB installation file to your device.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 relative">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-base text-slate-900">Open the Notification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When the download completes, swipe down your notification tray and tap <strong>{apkFileName}</strong>, or open it from your browser&apos;s Downloads menu.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 relative">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-base text-slate-900">Allow &amp; Install</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If prompted by Android security, tap <strong>Settings</strong> and toggle <strong>Allow from this source</strong>. Then tap <strong>Install</strong> to complete setup.
            </p>
          </div>
        </div>

        {/* Manufacturer Variation Note */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
          <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Device variations:</strong> On Samsung (One UI), Google Pixel, Xiaomi (HyperOS/MIUI), or OnePlus (OxygenOS), the prompt may say &quot;Install unknown apps&quot; or &quot;File might be harmful&quot;. This is standard Android security for any APK installed from a browser rather than the Play Store.
          </p>
        </div>
      </section>

      {/* TRUST, SAFETY & TRANSPARENCY SECTION */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              Trust &amp; Device Safety
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Installed safely. Never bypass device protections.
            </h2>
            <p className="text-sm text-slate-400">
              Clear facts regarding Android APK security prompts and how Hippocrates respects your device security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-white">Official Website Release</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This APK is distributed directly from <strong>https://www.hippocrates.in</strong>. It is built directly from the official Hippocrates project without third-party mirrors or modifications.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-white">Understanding the Security Prompt</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Android displays a generic warning when installing APKs directly from web browsers. Granting permission for your browser to install this specific file does not disable your overall device security.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-white">Keep Play Protect Active</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>Never disable Google Play Protect</strong> or system-wide security settings. Hippocrates installs safely with all default Android security scans and Play Protect fully active.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Answers &amp; Support
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600">
            Common questions regarding downloading, installing, and updating Hippocrates on Android.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-slate-900">{faq.q}</span>
                  <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* PROGRESSIVE WEB APP (PWA) SECTION — iOS & Universal Web Alternative */}
      <section id="pwa-guide" className="py-16 bg-[#fbfcfd] border-t border-slate-200/70 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Web &amp; PWA Alternative
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Prefer Not to Install an APK?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Hippocrates is built with modern Progressive Web App (PWA) technology. You can add it directly to your home screen from Safari (iOS) or Chrome (Android) with zero APK file downloads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* iOS Safari Card */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Apple className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Apple iPhone &amp; iPad (Safari)</h3>
                  <p className="text-xs text-slate-500">Native-feeling full-screen experience</p>
                </div>
              </div>

              <ol className="space-y-3 text-xs sm:text-sm text-slate-700 list-decimal list-inside leading-relaxed">
                <li>Open <strong>https://www.hippocrates.in</strong> in Safari.</li>
                <li>Tap the <strong>Share</strong> button (box with upward arrow) in the bottom toolbar.</li>
                <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>

              <div className="pt-2">
                <Link
                  href="/?persona=patient"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Launch in Safari</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Android Chrome PWA Card */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Android Browser PWA (Chrome)</h3>
                  <p className="text-xs text-slate-500">Zero APK download required</p>
                </div>
              </div>

              <ol className="space-y-3 text-xs sm:text-sm text-slate-700 list-decimal list-inside leading-relaxed">
                <li>Open <strong>https://www.hippocrates.in</strong> in Google Chrome.</li>
                <li>Tap the <strong>three vertical dots (⋮)</strong> in the upper right.</li>
                <li>Tap <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</li>
                <li>Hippocrates launches in a clean, dedicated standalone window.</li>
              </ol>

              <div className="pt-2">
                <Link
                  href="/?persona=patient"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Launch in Browser</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
