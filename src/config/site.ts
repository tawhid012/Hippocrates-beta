/**
 * Hippocrates AI — Site & SEO Configuration
 * Central source of truth for canonical URLs, metadata, brand entity identity, and navigation.
 */

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  badge?: string;
}

export interface SiteConfig {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  productionDomain: string;
  socials: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  contact: {
    email: string;
    supportEmail: string;
    clinicalInquiries: string;
    location: string;
  };
  founders: Array<{
    name: string;
    role: string;
    title: string;
  }>;
  academicGuides: Array<{
    name: string;
    role: string;
    title: string;
  }>;
}

export const SITE_CONFIG: SiteConfig = {
  name: "Hippocrates",
  legalName: "Hippocrates AI Health Technologies",
  tagline: "AI for Better-Informed Healthcare",
  description:
    "Discover Hippocrates, an AI-powered healthcare ecosystem featuring Aegis for patient-focused health information and report understanding, and Oracle for doctor-focused clinical support. Built around a vision of AI for Accessible Health Awareness.",
  productionDomain: "https://www.hippocrates.in",
  socials: {
    github: "https://github.com/tawhid012/Hippocrates-beta",
    twitter: "https://twitter.com/hippocrates_ai",
    linkedin: "https://linkedin.com/company/hippocrates-ai",
  },
  contact: {
    email: "contact@hippocrates.in",
    supportEmail: "support@hippocrates.in",
    clinicalInquiries: "clinical@hippocrates.in",
    location: "India",
  },
  founders: [
    {
      name: "Tawhidur Rahman Laskar",
      role: "Founder",
      title: "Architecture & System Lead",
    },
    {
      name: "Ahmed Al-Ferdous",
      role: "Co-Founder",
      title: "Research & Interface Co-Developer",
    },
  ],
  academicGuides: [
    {
      name: "Abdul Basith Barbhuiya",
      role: "Project Guide",
      title: "Academic Mentorship & Guidance",
    },
  ],
};

/**
 * Determine the canonical base URL safely.
 * Precedence:
 * 1. NEXT_PUBLIC_CANONICAL_URL (explicit production override)
 * 2. NEXT_PUBLIC_SITE_URL (configured deployment origin)
 * 3. Default fallback to https://hippocrates.in
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_CANONICAL_URL) {
    return process.env.NEXT_PUBLIC_CANONICAL_URL.replace(/\/+$/, "");
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  // Production default
  return SITE_CONFIG.productionDomain;
}

/**
 * Checks whether the current deployment is a preview or non-production build.
 * Vercel sets VERCEL_ENV="preview" | "development" | "production".
 */
export function isPreviewDeployment(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "development" ||
    process.env.NODE_ENV === "development"
  );
}

/**
 * Constructs an absolute canonical URL from a pathname.
 */
export function getAbsoluteUrl(path: string = "/"): string {
  const baseUrl = getSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === "/") {
    return baseUrl;
  }
  return `${baseUrl}${cleanPath}`;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Platform", href: "/platform", description: "Dual-engine architecture overview" },
  { label: "Aegis", href: "/aegis", description: "Patient health intelligence & report assistant", badge: "Patients" },
  { label: "Oracle", href: "/oracle", description: "Physician clinical copilot & differentials", badge: "Doctors" },
  { label: "Medical Reports", href: "/medical-reports", description: "Educational lab test breakdown" },
  { label: "Safety", href: "/safety", description: "Responsible healthcare AI principles" },
  { label: "Knowledge Hub", href: "/knowledge", description: "Reviewed clinical guides & articles" },
  { label: "About", href: "/about", description: "Team, mission & project origin" },
  { label: "Contact", href: "/contact", description: "Get in touch with our team" },
];

export const FOOTER_PLATFORM_LINKS: NavItem[] = [
  { label: "Platform Overview", href: "/platform" },
  { label: "Aegis for Patients", href: "/aegis" },
  { label: "Oracle for Doctors", href: "/oracle" },
  { label: "For Patients Hub", href: "/for-patients" },
  { label: "For Doctors Hub", href: "/for-doctors" },
  { label: "Medical Reports", href: "/medical-reports" },
  { label: "Get Started & Apps", href: "/get-started" },
];

export const FOOTER_RESOURCES_LINKS: NavItem[] = [
  { label: "Knowledge Hub", href: "/knowledge" },
  { label: "Understanding CBC Reports", href: "/knowledge/understanding-cbc-blood-test" },
  { label: "Doctor Visit Preparation", href: "/knowledge/how-to-prepare-for-doctor-visit" },
  { label: "Clinical AI Explained", href: "/knowledge/ai-clinical-decision-support-explained" },
  { label: "Thyroid Blood Tests", href: "/knowledge/understanding-thyroid-panels" },
  { label: "Responsible AI in Healthcare", href: "/knowledge/responsible-ai-in-healthcare" },
];

export const FOOTER_COMPANY_LINKS: NavItem[] = [
  { label: "About Us", href: "/about" },
  { label: "Responsible AI & Safety", href: "/safety" },
  { label: "Contact & Support", href: "/contact" },
  { label: "Privacy Practices", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Medical Disclaimer", href: "/disclaimer" },
];
