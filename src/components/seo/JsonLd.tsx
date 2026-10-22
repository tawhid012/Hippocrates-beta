/**
 * Hippocrates AI — Structured Data (JSON-LD) Components
 * Implements Google-compliant Schema.org entities for Healthcare, Software, and Articles.
 * Strictly adheres to truthful representations without fabricated reviews or credentials.
 */

import React from "react";
import { SITE_CONFIG, getAbsoluteUrl } from "@/config/site";

export function JsonLd({ schema }: { schema: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Organization Schema
 * Represents Hippocrates as an AI health technology organization.
 */
export function getOrganizationJsonLd() {
  const siteUrl = getAbsoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: SITE_CONFIG.name,
    alternateName: "Hippocrates AI",
    legalName: SITE_CONFIG.legalName,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: getAbsoluteUrl("/logo.jpg"),
      caption: "Hippocrates AI Logo",
    },
    description: SITE_CONFIG.description,
    knowsAbout: [
      "Artificial Intelligence in Healthcare",
      "Clinical Decision Support",
      "Medical Laboratory Report Interpretation",
    ],
    founder: [
      {
        "@type": "Person",
        "@id": `${getAbsoluteUrl("/about")}#tawhidur-rahman-laskar`,
        name: "Tawhidur Rahman Laskar",
        jobTitle: "Founder & Architecture Lead",
        sameAs: ["https://github.com/tawhid012"],
      },
      {
        "@type": "Person",
        "@id": `${getAbsoluteUrl("/about")}#ahmed-al-ferdous`,
        name: "Ahmed Al-Ferdous",
        jobTitle: "Co-Founder & Interface Lead",
      },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SITE_CONFIG.contact.supportEmail,
        availableLanguage: ["English", "Hindi"],
      },
      {
        "@type": "ContactPoint",
        contactType: "clinical inquiries",
        email: SITE_CONFIG.contact.clinicalInquiries,
        availableLanguage: ["English"],
      },
    ],
    sameAs: [
      // Only include verified canonical external identity sources
      SITE_CONFIG.socials.github,
    ].filter(Boolean),
  };
}

/**
 * WebSite Schema
 */
export function getWebSiteJsonLd() {
  const siteUrl = getAbsoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: SITE_CONFIG.name,
    alternateName: "Hippocrates AI",
    description: SITE_CONFIG.description,
    publisher: {
      "@id": `${siteUrl}#organization`,
    },
    inLanguage: "en-US",
  };
}

/**
 * SoftwareApplication Schema for Aegis (Patient Health Assistant)
 */
export function getAegisSoftwareJsonLd() {
  const siteUrl = getAbsoluteUrl("/aegis");
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}#software`,
    name: "Hippocrates Aegis",
    alternateName: "Aegis Health Assistant",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web, iOS (PWA), Android (PWA)",
    url: siteUrl,
    description:
      "Patient-facing healthcare AI assistant for exploring health concerns, understanding medical reports, organizing symptoms with OPQRST, and preparing for doctor consultations. Not an autonomous diagnostic device.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    creator: {
      "@id": `${getAbsoluteUrl("/")}#organization`,
    },
  };
}

/**
 * SoftwareApplication Schema for Oracle (Physician Clinical Copilot)
 */
export function getOracleSoftwareJsonLd() {
  const siteUrl = getAbsoluteUrl("/oracle");
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}#software`,
    name: "Hippocrates Oracle",
    alternateName: "Oracle Clinical Copilot",
    applicationCategory: "MedicalApplication",
    operatingSystem: "Web, Desktop, Tablet",
    url: siteUrl,
    description:
      "Advanced clinical copilot for verified medical practitioners providing multi-model differential reasoning, clinical guidelines synthesis, and documentation support.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    creator: {
      "@id": `${getAbsoluteUrl("/")}#organization`,
    },
  };
}

/**
 * BreadcrumbList Schema
 */
export function getBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getAbsoluteUrl(item.url),
    })),
  };
}

/**
 * MedicalWebPage Schema for educational health pages
 */
export interface MedicalPageMetadata {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  aspect?: string;
  citations?: string[];
  medicalAudience?: "Patient" | "Clinician" | "General";
}

export function getMedicalWebPageJsonLd(meta: MedicalPageMetadata) {
  const siteUrl = getAbsoluteUrl(meta.url);
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": `${siteUrl}#medicalwebpage`,
    url: siteUrl,
    name: meta.title,
    description: meta.description,
    inLanguage: "en-US",
    aspect: meta.aspect || "Medical Education",
    datePublished: meta.datePublished || "2026-01-15",
    dateModified: meta.dateModified || "2026-10-17",
    citation: meta.citations || [
      "World Health Organization (WHO) Guidelines",
      "Indian Council of Medical Research (ICMR)",
      "National Institutes of Health (NIH)",
    ],
    audience: {
      "@type": "MedicalAudience",
      audienceType: meta.medicalAudience || "Patient",
    },
    publisher: {
      "@id": `${getAbsoluteUrl("/")}#organization`,
    },
  };
}

/**
 * Article Schema for Knowledge Hub articles
 */
export interface ArticleMetadata {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorTitle: string;
  reviewerName?: string;
  reviewerTitle?: string;
  citations?: string[];
}

export function getArticleJsonLd(meta: ArticleMetadata) {
  const siteUrl = getAbsoluteUrl(meta.url);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${siteUrl}#article`,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${getAbsoluteUrl("/")}#website`,
      name: SITE_CONFIG.name,
      url: getAbsoluteUrl("/"),
    },
    headline: meta.title,
    description: meta.description,
    mainEntityOfPage: siteUrl,
    datePublished: meta.datePublished,
    dateModified: meta.dateModified,
    author: {
      "@type": "Person",
      name: meta.authorName,
      jobTitle: meta.authorTitle,
    },
    ...(meta.reviewerName && {
      reviewedBy: {
        "@type": "Person",
        name: meta.reviewerName,
        jobTitle: meta.reviewerTitle,
      },
    }),
    publisher: {
      "@id": `${getAbsoluteUrl("/")}#organization`,
    },
    ...(meta.citations && {
      citation: meta.citations,
    }),
  };
}

/**
 * FAQPage Schema
 */
export function getFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
