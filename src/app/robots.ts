import { MetadataRoute } from "next";
import { getSiteUrl, isPreviewDeployment } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  // If running on a Vercel preview or development deployment, disallow all indexing
  if (isPreviewDeployment()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  // Major search and AI discovery crawlers
  const allowedUserAgents = [
    "*",
    "Googlebot",
    "Bingbot",
    "GPTBot",
    "PerplexityBot",
    "ClaudeBot",
    "Applebot",
  ];

  return {
    rules: allowedUserAgents.map((agent) => ({
      userAgent: agent,
      allow: "/",
      disallow: ["/api/*", "/auth/*"],
    })),
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
