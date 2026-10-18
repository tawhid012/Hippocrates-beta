import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AppDownloadClient } from "@/components/download/AppDownloadClient";

export const metadata: Metadata = {
  title: "Download Hippocrates for Android (Official APK) — Hippocrates AI",
  description:
    "Download the official Hippocrates Android application (APK). Access dual-engine clinical intelligence, symptom education, and medical report explanations on your Android smartphone.",
  keywords: [
    "Hippocrates Android app",
    "download Hippocrates APK",
    "Hippocrates APK",
    "install Hippocrates on Android",
    "Aegis Android app",
    "Oracle clinical app",
    "healthcare AI Android app",
    "Hippocrates mobile",
  ],
  alternates: {
    canonical: "/get-started",
  },
  openGraph: {
    title: "Download Hippocrates for Android (Official APK) — Hippocrates AI",
    description:
      "Explore Hippocrates on your Android device for convenient access to its available health-information and clinical-support features.",
    url: "/get-started",
    images: [
      {
        url: "/hippocrates-og.png",
        width: 1024,
        height: 536,
        alt: "Download Hippocrates Android App (Official APK)",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Download Hippocrates for Android (Official APK) — Hippocrates AI",
    description:
      "Explore Hippocrates on your Android device for convenient access to its available health-information and clinical-support features.",
    images: ["/hippocrates-og.png"],
  },
};

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <div>
        <PublicNavbar />
        <Breadcrumbs items={[{ label: "Download Android App", href: "/get-started" }]} />

        <AppDownloadClient
          apkFileName="HIPPOCRATES.apk"
          apkSizeFormatted="4.9 MB"
          apkSizeBytes={5115229}
          apkSha256="e9e5ad48ca4aa2572dd8a2b7c087b1810b34897c8f06e29343432b8020ecaafd"
          packageName="ai.hippocrates.app"
          versionName="v1.0.0"
        />
      </div>

      <PublicFooter />
    </div>
  );
}
