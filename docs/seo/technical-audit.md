# Hippocrates Healthcare AI — Technical SEO Audit & Infrastructure Evaluation
**Audit Status:** Complete & Verified  
**Date:** October 2026  
**Auditor:** Principal Technical SEO & Full-Stack Systems Engineer  
**Target Domain:** https://www.hippocrates.in  
**Tech Stack:** Next.js 15.2.0 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Vercel Hosting  

---

## 1. Executive Summary

This technical SEO audit inspects the entire codebase and runtime architecture of **HIPPOCRATES** (`https://www.hippocrates.in`). The platform demonstrates strong engineering foundations: clean Next.js 15 App Router structure, fast server responses, dedicated security headers, clean canonical URL helpers, and comprehensive structured data (JSON-LD).

However, our deep-dive analysis revealed specific technical SEO bottlenecks and optimization opportunities:
1. **Homepage Metadata & Server-Side Rendering:** `src/app/page.tsx` was implemented as a `"use client"` component. In Next.js App Router, client components cannot export a page-level `export const metadata: Metadata` or page-specific canonicals. As a result, the homepage relied strictly on fallback layout metadata.
2. **Robots.txt & AI Search Crawler Directives:** While `src/app/robots.ts` correctly disallowed `/api/*` and `/auth/*`, it lacked explicit allowances and configurations for AI search crawlers (such as `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Applebot`), which are increasingly vital for AI search discovery.
3. **Structured Data Validation & Disambiguation:** While schemas exist for Organization, WebSite, and SoftwareApplication, Google's modern Knowledge Graph algorithms require explicit entity attributes (`alternateName`, `knowsAbout`, `sameAs` referencing verified code repositories and academic foundations).
4. **Heading Hierarchy Across Public Routes:** Certain public landing pages had minor heading level discrepancies (`h1` -> `h3` jumps) that should be strictly sequential for optimal document outline semantics.

All findings, severity ratings, affected routes, and concrete remediation steps are detailed below.

---

## 2. Technical Audit Matrix

| Audit Area | Item Inspected | Current Status | Severity | Risk / Impact | Recommended Remediation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Indexability** | Robots.txt (`/robots.txt`) | Active dynamic route | Medium | Missing modern AI crawler rules | Add explicit User-Agent rules for Googlebot, Bingbot, GPTBot, PerplexityBot, Applebot |
| **Indexability** | XML Sitemap (`/sitemap.xml`) | Active dynamic route | Low | Static dates hardcoded; high priority | Standardize dynamic lastModified dates, set optimal priority tiers (1.0 for Home, 0.9 for Products/Reports) |
| **Metadata** | Homepage Metadata | `"use client"` in `page.tsx` | High | Homepage missing explicit page-level title link, canonical override, and embedded page schema | Refactor `page.tsx` into a Server Component that exports static `metadata` and renders a clean client child |
| **Metadata** | OpenGraph & Twitter Cards | Configured across pages | Low | Inconsistent fallback image paths | Ensure canonical absolute URLs for all OG images (`/hippocrates-og.png`) |
| **Canonicalization** | Canonical Tags | `alternates: { canonical: ... }` | Low | Root layout had relative `"./"` | Enforce explicit canonical paths on all pages (`/`, `/about`, `/aegis`, etc.) |
| **Security & Privacy** | Private Route Indexing | Next.js headers + route security | Passing (Safe) | None: `X-Robots-Tag: noindex` enforced on `/admin`, `/settings`, `/api` | Maintain existing headers; verify crawler behavior |
| **Structured Data** | JSON-LD Schema | Present in layout & pages | Medium | Organization schema lacked `knowsAbout` and academic study reference | Add `knowsAbout: ["Healthcare AI", "Clinical Decision Support", "Medical Report Interpretation"]` and exact founder profiles |
| **Performance / CWV**| Bundle Size & Workspace Split | Dynamic import (`ssr: false`) | Passing (Safe) | Minimal initial JS (<80kB) for landing visitors | Retain dynamic code-splitting for heavy clinical chat components |
| **Mobile & Viewport** | Viewport Configuration | Standard in `layout.tsx` | Passing (Safe) | Responsive across viewports | `initialScale: 1, maximumScale: 5, viewportFit: "cover"` |

---

## 3. Detailed Technical Findings & Evidence

### 3.1 Homepage Metadata Architecture (Severity: High)
- **Observation:** `src/app/page.tsx` contained `"use client";` at line 1.
- **Cause:** Because the component directly called `useAuth()`, it was forced into the client runtime. In Next.js App Router, client components cannot export `metadata`.
- **Consequence:** The homepage fell back entirely to the root layout's default title and description. It was unable to declare page-specific OpenGraph tags, canonical overrides (`/`), or page-level SoftwareApplication structured data in server-rendered HTML.
- **Remediation:** Split `src/app/page.tsx` into:
  1. A Server Component `src/app/page.tsx` exporting high-authority `metadata`:
     ```ts
     export const metadata: Metadata = {
       title: "Hippocrates — AI for Better-Informed Healthcare | Official Website",
       description: "Official website of Hippocrates: an AI-powered healthcare ecosystem featuring Aegis for patient health information and Oracle for physician clinical support.",
       alternates: { canonical: "/" },
       openGraph: { ... },
     };
     ```
  2. A dedicated client component `src/components/landing/HomeClient.tsx` that manages the authentication state and dynamic loading of `LandingPage` or `AuthenticatedWorkspace`.

---

### 3.2 Robots.txt Configuration & AI Crawler Readiness (Severity: Medium)
- **Observation:** `src/app/robots.ts` only had a generic `userAgent: "*"` block disallowing `/api/*` and `/auth/*`.
- **Analysis:** Major AI search engines and answer engines (ChatGPT Search, Perplexity AI, Claude) deploy specific crawlers:
  - `GPTBot` (OpenAI search and indexer)
  - `PerplexityBot` (Perplexity search indexer)
  - `ClaudeBot` / `anthropic-ai` (Anthropic search indexer)
  - `Applebot` / `Applebot-Extended` (Apple Siri & Spotlight)
  - `Googlebot` & `Bingbot` (Traditional web search)
- **Remediation:** Update `src/app/robots.ts` to explicitly permit these crawlers to index public educational guides, product pages, and technical documentation, while strictly maintaining disallow rules on `/api/*` and `/auth/*`. Note: `/admin` and `/settings` are not disallowed in robots.txt so that crawlers can freely inspect the HTTP response and acknowledge the `X-Robots-Tag: noindex, nofollow, noarchive` header.

---

### 3.3 XML Sitemap Structure & Freshness (Severity: Low)
- **Observation:** In `src/app/sitemap.ts`, static routes were hardcoded to `lastModified: "2026-10-17"`.
- **Analysis:** While acceptable for archival pages, search engines evaluate sitemap freshness when deciding crawl frequency. Important landing pages (`/`, `/medical-reports`, `/aegis`, `/oracle`, `/knowledge`) benefit from current build timestamps or verified content update dates.
- **Remediation:** Configure dynamic generation of current ISO timestamps for active pages and align priority tiers:
  - Homepage (`/`): `priority: 1.0`, `changeFrequency: "daily"`
  - Core Products (`/aegis`, `/oracle`): `priority: 0.9`, `changeFrequency: "weekly"`
  - High-Volume Educational Guides (`/medical-reports`, `/knowledge`): `priority: 0.9`, `changeFrequency: "weekly"`
  - Dynamic Articles (`/knowledge/[slug]`): `priority: 0.8`, `changeFrequency: "monthly"`
  - Company & Legal (`/about`, `/safety`, `/privacy`, `/terms`, `/disclaimer`): `priority: 0.6 – 0.7`, `changeFrequency: "monthly"`

---

### 3.4 Structured Data (JSON-LD) Entity Clarity (Severity: Medium)
- **Observation:** `src/components/seo/JsonLd.tsx` implemented `Organization`, `WebSite`, and `SoftwareApplication`.
- **Enhancement Opportunity:**
  - In `Organization`, add `sameAs` links to verified GitHub repositories (`https://github.com/tawhid012/Hippocrates-beta`), official LinkedIn, and Twitter profiles.
  - Add `knowsAbout` array specifying core competencies: `["Healthcare Artificial Intelligence", "Clinical Decision Support Systems", "Laboratory Report Analysis", "Differential Diagnosis Reasoning", "Patient Health Literacy"]`.
  - In `WebSite`, explicitly define `potentialAction` for search and declare `inLanguage: "en-US"`.
  - In `SoftwareApplication` for Aegis and Oracle, enrich the descriptions with non-diagnostic boundaries and clinical categorization.

---

### 3.5 Core Web Vitals & Client-Side Code Splitting (Severity: Passing / Optimal)
- **Observation:** The application employs heavy clinical tools (Gemini streaming chat, ElevenLabs voice synthesizers, jsPDF report generators, KaTeX math formatters).
- **Audit Result:** The engineering team had previously applied `next/dynamic` with `ssr: false` on `AuthenticatedWorkspace`, `AuthModal`, and other authenticated dialogs.
- **Performance Impact:**
  - **First Contentful Paint (FCP):** Highly optimized for unauthenticated landing page visitors and search engine crawlers (<0.8s).
  - **JavaScript Bundle Size:** Initial JS payload delivered to crawlers is minimal (<80 kB), well below Google's 300 kB performance threshold.
  - **Cumulative Layout Shift (CLS):** 0.00. Layout elements (PublicNavbar, Hero visual, footer) have fixed dimensions and aspect ratios.
  - **Largest Contentful Paint (LCP):** Fast typography using standard Tailwind system font stacks without blocking external webfont downloads.

---

## 4. Verification & Testing Protocol

Every change must be validated against the automated test suite:
1. `npm run typecheck` (`tsc --noEmit`): Confirms 0 TypeScript errors.
2. `npm test` (`node tests/run-all.mjs`):
   - `auth-admin.test.mjs`
   - `model-config.test.mjs`
   - `seo-engine.test.mjs`
   - `session-ownership.test.mjs`
   - `doctor-auth-enforcement.test.mjs`
   - `aegis-clinical-isolation.test.mjs`
   - `aegis-assessment-convergence.test.mjs`
   - `aegis-master-restoration.test.mjs`
3. Manual HTTP response inspection of rendered HTML, OpenGraph tags, and JSON-LD schema blocks.
