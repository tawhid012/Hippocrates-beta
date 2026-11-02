import type { Metadata } from "next";
import { HomeClient } from "@/components/landing/HomeClient";

export const metadata: Metadata = {
  title: "Hippocrates AI - Dual-Engine Clinical Intelligence by Tawhid Laskar",
  description:
    "Hippocrates is an independent AI clinical platform developed by Tawhid Laskar in Assam, India. Featuring the Aegis patient assistant and Oracle clinical copilot.",
  keywords:
    "hippocrates tawhid, hippocrates assam, hippocrates india, hippocrates ai assam, tawhid laskar, aegis oracle clinical platform",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hippocrates AI by Tawhid Laskar",
    description:
      "Responsible healthcare intelligence built in Assam, India by web developer Tawhid Laskar.",
    url: "https://hippocrates.in",
    siteName: "Hippocrates AI",
    images: [
      {
        url: "/hippocrates-og.png",
        width: 1024,
        height: 536,
        alt: "Hippocrates AI - Dual-Engine Clinical Intelligence by Tawhid Laskar",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hippocrates AI by Tawhid Laskar",
    description:
      "Responsible healthcare intelligence built in Assam, India by web developer Tawhid Laskar.",
    images: ["/hippocrates-og.png"],
    creator: "@hippocrates_ai",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
