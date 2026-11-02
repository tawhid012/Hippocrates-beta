import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/hooks/useAppContext";
import { isPreviewDeployment } from "@/config/site";
import { JsonLd, getOrganizationJsonLd, getWebSiteJsonLd, SOFTWARE_APPLICATION_JSON_LD } from "@/components/seo/JsonLd";

const siteUrl = "https://hippocrates.in";
const isPreview = isPreviewDeployment();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hippocrates AI - Dual-Engine Clinical Intelligence by Tawhid Laskar",
    template: "%s | Hippocrates AI",
  },
  description:
    "Hippocrates is an independent AI clinical platform developed by Tawhid Laskar in Assam, India. Featuring the Aegis patient assistant and Oracle clinical copilot.",
  applicationName: "Hippocrates AI",
  authors: [{ name: "Tawhid Laskar" }],
  generator: "Next.js",
  keywords:
    "hippocrates tawhid, hippocrates assam, hippocrates india, hippocrates ai assam, tawhid laskar, aegis oracle clinical platform",
  referrer: "origin-when-cross-origin",
  creator: "Tawhid Laskar",
  publisher: "Tawhid Laskar",
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
    url: "https://hippocrates.in",
    siteName: "Hippocrates AI",
    title: "Hippocrates AI by Tawhid Laskar",
    description:
      "Responsible healthcare intelligence built in Assam, India by web developer Tawhid Laskar.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(SOFTWARE_APPLICATION_JSON_LD),
          }}
        />
      </head>
      <body className="min-h-full antialiased bg-[#fcfdfe] text-slate-900" suppressHydrationWarning>
        <AuthProvider>
          <AppProvider>{children}</AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
