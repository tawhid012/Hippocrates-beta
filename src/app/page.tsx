import type { Metadata } from "next";
import { HomeClient } from "@/components/landing/HomeClient";
import { SITE_CONFIG } from "@/config/site";

export const metadata: Metadata = {
  title: "Hippocrates — AI for Better-Informed Healthcare | Official Website",
  description:
    "Official website of Hippocrates: an AI-powered healthcare ecosystem featuring Aegis, the patient-facing AI assistant for conversational health guidance, symptom organization, report intelligence, and doctor consultation preparation, and Oracle for physician clinical decision support.",
  keywords: [
    "Hippocrates",
    "Hippocrates AI",
    "Hippocrates official website",
    "Hippocrates healthcare AI",
    "Hippocrates Aegis",
    "Hippocrates Oracle",
    "patient-facing healthcare AI assistant",
    "AI clinical copilot",
    "AI health assistant",
    "medical report explanation",
    "symptom history and doctor visit preparation",
    "understanding blood test reports",
    "clinical decision support software",
    "AI tools for doctors",
    "responsible AI in healthcare",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hippocrates — AI for Better-Informed Healthcare | Official Website",
    description:
      "Official website of Hippocrates: an AI-powered healthcare ecosystem featuring Aegis, the patient-facing AI assistant for conversational health guidance, symptom organization, report intelligence, and doctor consultation preparation, and Oracle for physician clinical decision support.",
    url: "/",
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: "/hippocrates-og.png",
        width: 1024,
        height: 536,
        alt: "Hippocrates — AI for Better-Informed Healthcare. Aegis for Patients and Oracle for Clinicians.",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hippocrates — AI for Better-Informed Healthcare | Official Website",
    description:
      "Official website of Hippocrates: an AI-powered healthcare ecosystem featuring Aegis, the patient-facing AI assistant for conversational health guidance, symptom organization, report intelligence, and doctor consultation preparation, and Oracle for physician clinical decision support.",
    images: ["/hippocrates-og.png"],
    creator: "@hippocrates_ai",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
