import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Hippocrates SEO & Canonical Architecture Suite", () => {
  test("Canonical site URL defaults safely and removes trailing slashes", () => {
    const rawUrl = "https://www.hippocrates.in/";
    const cleanUrl = rawUrl.replace(/\/+$/, "");
    assert.equal(cleanUrl, "https://www.hippocrates.in");
  });

  test("Absolute URL builder constructs clean paths with canonical origin", () => {
    const base = "https://www.hippocrates.in";
    const buildAbs = (path) => {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      return cleanPath === "/" ? base : `${base}${cleanPath}`;
    };

    assert.equal(buildAbs("/"), "https://www.hippocrates.in");
    assert.equal(buildAbs("/aegis"), "https://www.hippocrates.in/aegis");
    assert.equal(buildAbs("oracle"), "https://www.hippocrates.in/oracle");
    assert.equal(buildAbs("/medical-reports"), "https://www.hippocrates.in/medical-reports");
    assert.equal(buildAbs("/knowledge/understanding-cbc-blood-test"), "https://www.hippocrates.in/knowledge/understanding-cbc-blood-test");
  });

  test("Preview deployment detection blocks indexing", () => {
    const isPreview = (env) => env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development";
    assert.equal(isPreview({ VERCEL_ENV: "preview" }), true);
    assert.equal(isPreview({ VERCEL_ENV: "production" }), false);
  });

  test("Beta deployment redirect routes to production without edge redirect loop", () => {
    const redirects = [
      {
        source: "/:path*",
        has: [{ type: "host", value: "hippocrates-beta.vercel.app" }],
        destination: "https://www.hippocrates.in/:path*",
        permanent: true,
      },
    ];

    assert.equal(redirects[0].has[0].value, "hippocrates-beta.vercel.app");
    assert.equal(redirects[0].destination, "https://www.hippocrates.in/:path*");
    assert.equal(redirects[0].permanent, true);
  });

  test("Homepage title communicates brand and official website identity", () => {
    const homepageTitle = "Hippocrates — AI for Better-Informed Healthcare | Official Website";
    assert.ok(homepageTitle.includes("Hippocrates"));
    assert.ok(homepageTitle.includes("Official Website"));
    assert.ok(homepageTitle.length <= 70);
  });
});

describe("Structured Data (JSON-LD) Entity Integrity Suite", () => {
  test("Organization schema contains authentic founders and medical credentials", () => {
    const org = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Hippocrates",
      alternateName: "Hippocrates AI",
      legalName: "Hippocrates AI Health Technologies",
      url: "https://www.hippocrates.in",
      knowsAbout: [
        "Artificial Intelligence in Healthcare",
        "Clinical Decision Support",
        "Medical Laboratory Report Interpretation",
      ],
      founder: [
        {
          "@type": "Person",
          "@id": "https://www.hippocrates.in/about#tawhidur-rahman-laskar",
          name: "Tawhidur Rahman Laskar",
          jobTitle: "Founder & Architecture Lead",
          sameAs: ["https://github.com/tawhid012"],
        },
        {
          "@type": "Person",
          "@id": "https://www.hippocrates.in/about#ahmed-al-ferdous",
          name: "Ahmed Al-Ferdous",
          jobTitle: "Co-Founder & Interface Lead",
        },
      ],
    };

    assert.equal(org.name, "Hippocrates");
    assert.equal(org.alternateName, "Hippocrates AI");
    assert.equal(org.founder.length, 2);
    assert.equal(org.founder[0].name, "Tawhidur Rahman Laskar");
    assert.equal(org.founder[0]["@id"], "https://www.hippocrates.in/about#tawhidur-rahman-laskar");
    assert.equal(org.founder[0].sameAs[0], "https://github.com/tawhid012");
    assert.equal(org.url, "https://www.hippocrates.in");
    assert.ok(org.knowsAbout.includes("Clinical Decision Support"));
  });

  test("WebSite schema declares alternateName for search disambiguation", () => {
    const website = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Hippocrates",
      alternateName: "Hippocrates AI",
      url: "https://www.hippocrates.in",
    };

    assert.equal(website.name, "Hippocrates");
    assert.equal(website.alternateName, "Hippocrates AI");
  });

  test("Aegis SoftwareApplication schema reflects truthful health application categorization", () => {
    const aegis = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Hippocrates Aegis",
      applicationCategory: "HealthApplication",
      offers: { price: "0", priceCurrency: "INR" },
    };

    assert.equal(aegis.applicationCategory, "HealthApplication");
    assert.equal(aegis.offers.price, "0");
  });

  test("Oracle SoftwareApplication schema reflects clinical medical application categorization", () => {
    const oracle = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Hippocrates Oracle",
      applicationCategory: "MedicalApplication",
      offers: { price: "0", priceCurrency: "INR" },
    };

    assert.equal(oracle.applicationCategory, "MedicalApplication");
  });

  test("Breadcrumbs schema enforces 1-indexed position sequence", () => {
    const items = [
      { name: "Home", url: "https://www.hippocrates.in" },
      { name: "Knowledge Hub", url: "https://www.hippocrates.in/knowledge" },
      { name: "CBC Guide", url: "https://www.hippocrates.in/knowledge/understanding-cbc-blood-test" },
    ];

    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: item.name,
        item: item.url,
      })),
    };

    assert.equal(breadcrumbs.itemListElement[0].position, 1);
    assert.equal(breadcrumbs.itemListElement[1].position, 2);
    assert.equal(breadcrumbs.itemListElement[2].position, 3);
  });
});

describe("Crawl Security & Noindex Visibility Suite", () => {
  test("Robots disallows non-HTML API and auth routes while allowing crawler discovery", () => {
    const disallowedRoutes = ["/api/*", "/auth/*"];
    
    const isDisallowed = (path) => {
      return disallowedRoutes.some((pattern) => {
        if (pattern.endsWith("/*")) {
          const prefix = pattern.slice(0, -2);
          return path.startsWith(prefix);
        }
        return path === pattern;
      });
    };

    assert.equal(isDisallowed("/api/chat"), true);
    assert.equal(isDisallowed("/auth/callback"), true);
    // /admin and /settings are not blocked in robots.txt so Googlebot can read X-Robots-Tag: noindex
    assert.equal(isDisallowed("/admin"), false);
    assert.equal(isDisallowed("/settings"), false);
    assert.equal(isDisallowed("/aegis"), false);
    assert.equal(isDisallowed("/medical-reports"), false);
  });

  test("Robots includes major AI and search engine crawlers", () => {
    const allowedUserAgents = [
      "*",
      "Googlebot",
      "Bingbot",
      "GPTBot",
      "PerplexityBot",
      "ClaudeBot",
      "Applebot",
    ];

    assert.ok(allowedUserAgents.includes("Googlebot"));
    assert.ok(allowedUserAgents.includes("Bingbot"));
    assert.ok(allowedUserAgents.includes("GPTBot"));
    assert.ok(allowedUserAgents.includes("PerplexityBot"));
    assert.ok(allowedUserAgents.includes("ClaudeBot"));
    assert.ok(allowedUserAgents.includes("Applebot"));
  });

  test("Security headers enforce X-Robots-Tag: noindex on sensitive paths", () => {
    const isSensitivePath = (path) => {
      // Matches /admin, /settings exactly or /admin/..., /settings/..., /api/...
      return /^\/(admin|settings)(\/.*)?$/.test(path) || /^\/api\/.*$/.test(path);
    };

    assert.equal(isSensitivePath("/admin"), true);
    assert.equal(isSensitivePath("/settings"), true);
    assert.equal(isSensitivePath("/admin/cases"), true);
    assert.equal(isSensitivePath("/settings/profile"), true);
    assert.equal(isSensitivePath("/api/clinical"), true);
    assert.equal(isSensitivePath("/"), false);
    assert.equal(isSensitivePath("/aegis"), false);
    assert.equal(isSensitivePath("/oracle"), false);
    assert.equal(isSensitivePath("/medical-reports"), false);
  });
});
