import { MetadataRoute } from "next";
import { getAbsoluteUrl, isPreviewDeployment } from "@/config/site";
import { KNOWLEDGE_ARTICLES } from "@/data/knowledgeArticles";

export default function sitemap(): MetadataRoute.Sitemap {
  // If preview build, do not produce indexable sitemap URLs
  if (isPreviewDeployment()) {
    return [];
  }

  const currentDate = new Date().toISOString().split("T")[0];

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: getAbsoluteUrl("/"),
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: getAbsoluteUrl("/aegis"),
      lastModified: "2026-10-17",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: getAbsoluteUrl("/oracle"),
      lastModified: "2026-10-17",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: getAbsoluteUrl("/for-patients"),
      lastModified: "2026-10-17",
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: getAbsoluteUrl("/for-doctors"),
      lastModified: "2026-10-17",
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: getAbsoluteUrl("/medical-reports"),
      lastModified: "2026-10-17",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: getAbsoluteUrl("/platform"),
      lastModified: "2026-10-17",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: getAbsoluteUrl("/safety"),
      lastModified: "2026-10-17",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: getAbsoluteUrl("/about"),
      lastModified: "2026-10-17",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: getAbsoluteUrl("/get-started"),
      lastModified: "2026-10-17",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: getAbsoluteUrl("/knowledge"),
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: getAbsoluteUrl("/contact"),
      lastModified: "2026-10-17",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: getAbsoluteUrl("/privacy"),
      lastModified: "2026-10-17",
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: getAbsoluteUrl("/terms"),
      lastModified: "2026-10-17",
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: getAbsoluteUrl("/disclaimer"),
      lastModified: "2026-10-17",
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic educational articles
  const articleRoutes: MetadataRoute.Sitemap = KNOWLEDGE_ARTICLES.map((article) => ({
    url: getAbsoluteUrl(`/knowledge/${article.slug}`),
    lastModified: article.dateModified,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...staticRoutes, ...articleRoutes];
}
