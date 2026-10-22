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
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: getAbsoluteUrl("/oracle"),
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: getAbsoluteUrl("/medical-reports"),
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: getAbsoluteUrl("/for-patients"),
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: getAbsoluteUrl("/for-doctors"),
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: getAbsoluteUrl("/knowledge"),
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: getAbsoluteUrl("/platform"),
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: getAbsoluteUrl("/safety"),
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: getAbsoluteUrl("/get-started"),
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: getAbsoluteUrl("/about"),
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: getAbsoluteUrl("/contact"),
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: getAbsoluteUrl("/privacy"),
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: getAbsoluteUrl("/terms"),
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: getAbsoluteUrl("/disclaimer"),
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic educational articles
  const articleRoutes: MetadataRoute.Sitemap = KNOWLEDGE_ARTICLES.map((article) => ({
    url: getAbsoluteUrl(`/knowledge/${article.slug}`),
    lastModified: article.dateModified,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...articleRoutes];
}
