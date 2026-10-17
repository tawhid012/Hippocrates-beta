import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/hooks/useAppContext";
import { ThemeProvider } from "@/context/ThemeContext";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hippocrates.ai";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Hippocrates AI — Clinical Intelligence Platform",
  description: "AI-powered clinical intelligence platform for doctors and patients. Real-time diagnostic assistance, automated consultation documentation, and emergency escalation.",
  applicationName: "Hippocrates AI",
  keywords: ["Hippocrates AI", "clinical intelligence", "medical AI", "clinical decision support", "voice copilot", "doctor consultation"],
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/logo.jpg", type: "image/jpeg" },
    ],
    apple: [
      { url: "/logo.png", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Hippocrates AI — Clinical Intelligence Platform",
    description: "AI-powered clinical intelligence for doctors and patients. Real-time diagnostic assistance and ambient consultation documentation.",
    siteName: "Hippocrates AI",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "Hippocrates AI Clinical Intelligence Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hippocrates AI — Clinical Intelligence Platform",
    description: "AI-powered clinical intelligence for doctors and patients.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fcfdfe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full h-[100dvh] w-full overflow-hidden" suppressHydrationWarning>
      <head>
        {/* Anti-flash early theme detection & crypto.randomUUID polyfill */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem("hippocrates-theme");
                var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                var shouldUseDark = savedTheme === "dark" || ((!savedTheme || savedTheme === "system") && prefersDark);
                if (shouldUseDark) {
                  document.documentElement.classList.add("dark");
                  document.documentElement.style.colorScheme = "dark";
                } else {
                  document.documentElement.classList.remove("dark");
                  document.documentElement.style.colorScheme = "light";
                }
              } catch (e) {}

              if (typeof window !== "undefined") {
                if (!window.crypto) window.crypto = {};
                if (typeof window.crypto.randomUUID !== "function") {
                  window.crypto.randomUUID = function() {
                    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
                      var r = Math.random() * 16 | 0;
                      var v = c === "x" ? r : (r & 0x3 | 0x8);
                      return v.toString(16);
                    });
                  };
                }
              }
            `,
          }}
        />
      </head>
      <body
        className="h-full h-[100dvh] w-full overflow-hidden select-none overscroll-none antialiased bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>{children}</AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
