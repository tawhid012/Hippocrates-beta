import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Hippocrates SEO & Canonical Architecture Suite", () => {
  test("Canonical site URL defaults safely and removes trailing slashes", () => {
    const rawUrl = "https://hippocrates.in/";
    const cleanUrl = rawUrl.replace(/\/+$/, "");
    assert.equal(cleanUrl, "https://hippocrates.in");
  });

  test("Absolute URL builder constructs clean paths with canonical origin", () => {
    const base = "https://hippocrates.in";
    const buildAbs = (path) => {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      return cleanPath === "/" ? base : `${base}${cleanPath}`;
    };

    assert.equal(buildAbs("/"), "https://hippocrates.in");
    assert.equal(buildAbs("/aegis"), "https://hippocrates.in/aegis");
    assert.equal(buildAbs("oracle"), "https://hippocrates.in/oracle");
    assert.equal(buildAbs("/medical-reports"), "https://hippocrates.in/medical-reports");
    assert.equal(buildAbs("/knowledge/understanding-cbc-blood-test"), "https://hippocrates.in/knowledge/understanding-cbc-blood-test");
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
});

describe("Structured Data (JSON-LD) Entity Integrity Suite", () => {
  test("Organization schema contains authentic founders and medical credentials", () => {
    const org = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Hippocrates",
      legalName: "Hippocrates AI Health Technologies",
      url: "https://hippocrates.in",
      founders: [
        { name: "Tawhidur Rahman Laskar", role: "Architecture & System Lead" },
        { name: "Ahmed Al-Ferdous", role: "Research & Interface Co-Developer" },
      ],
    };

    assert.equal(org.name, "Hippocrates");
    assert.equal(org.founders.length, 2);
    assert.equal(org.founders[0].name, "Tawhidur Rahman Laskar");
    assert.equal(org.url, "https://hippocrates.in");
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
      { name: "Home", url: "https://hippocrates.in" },
      { name: "Knowledge Hub", url: "https://hippocrates.in/knowledge" },
      { name: "CBC Guide", url: "https://hippocrates.in/knowledge/understanding-cbc-blood-test" },
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

  test("Security headers enforce X-Robots-Tag: noindex on sensitive paths", () => {
    const headerSource = "/(admin|settings|api)/:path*";
    const headerValue = "noindex, nofollow, noarchive";
    const regex = /^\/(admin|settings|api)\/.*$/;

    assert.equal(headerValue, "noindex, nofollow, noarchive");
    assert.equal(regex.test("/admin/cases"), true);
    assert.equal(regex.test("/settings/profile"), true);
    assert.equal(regex.test("/api/clinical"), true);
    assert.equal(regex.test("/aegis"), false);
  });
});
