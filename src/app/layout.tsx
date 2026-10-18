import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/hooks/useAppContext";
import { SITE_CONFIG, getSiteUrl, isPreviewDeployment } from "@/config/site";
import { JsonLd, getOrganizationJsonLd, getWebSiteJsonLd } from "@/components/seo/JsonLd";

const siteUrl = getSiteUrl();
const isPreview = isPreviewDeployment();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hippocrates — AI for Better-Informed Healthcare",
    template: "%s | Hippocrates",
  },
  description: SITE_CONFIG.description,
  applicationName: "Hippocrates AI",
  authors: SITE_CONFIG.founders.map((f) => ({ name: f.name })),
  generator: "Next.js",
  keywords: [
    "Hippocrates AI",
    "Hippocrates healthcare AI",
    "Hippocrates app",
    "Hippocrates Aegis",
    "Hippocrates Oracle",
    "AI clinical copilot",
    "AI health assistant",
    "medical report explanation",
    "understanding blood test reports",
    "preparing questions for a doctor",
    "clinical decision support software",
    "AI medical documentation",
    "AI tools for doctors",
    "responsible AI in healthcare",
    "accessible health awareness",
  ],
  referrer: "origin-when-cross-origin",
  creator: SITE_CONFIG.legalName,
  publisher: SITE_CONFIG.legalName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: SITE_CONFIG.name,
    title: "Hippocrates — AI for Better-Informed Healthcare",
    description: SITE_CONFIG.description,
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
    title: "Hippocrates — AI for Better-Informed Healthcare",
    description: SITE_CONFIG.description,
    images: ["/hippocrates-og.png"],
    creator: "@hippocrates_ai",
  },
  robots: isPreview
    ? {
        index: false,
        follow: false,
      }
    : {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
          index: true,
          follow: true,
          noimageindex: false,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/logo.jpg", sizes: "32x32", type: "image/jpeg" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION && {
        "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
      }),
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = getOrganizationJsonLd();
  const webSiteJsonLd = getWebSiteJsonLd();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd schema={organizationJsonLd} />
        <JsonLd schema={webSiteJsonLd} />
      </head>
      <body className="min-h-full antialiased bg-[#fcfdfe] text-slate-900" suppressHydrationWarning>
        <AuthProvider>
          <AppProvider>{children}</AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
