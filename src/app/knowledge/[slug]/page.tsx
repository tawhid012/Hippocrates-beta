import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  KNOWLEDGE_ARTICLES,
  getArticleBySlug,
} from "@/data/knowledgeArticles";
import {
  JsonLd,
  getArticleJsonLd,
  getMedicalWebPageJsonLd,
} from "@/components/seo/JsonLd";
import {
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return KNOWLEDGE_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: `${article.title} — Medical Guide`,
    description: article.description,
    keywords: article.keywords,
    authors: [{ name: article.author.name }],
    alternates: {
      canonical: `/knowledge/${article.slug}`,
    },
    openGraph: {
      title: `${article.title} — Hippocrates Knowledge Hub`,
      description: article.description,
      type: "article",
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified,
      authors: [article.author.name],
      url: `/knowledge/${article.slug}`,
    },
  };
}

export default async function KnowledgeArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const articleJsonLd = getArticleJsonLd({
    title: article.title,
    description: article.description,
    url: `/knowledge/${article.slug}`,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    authorName: article.author.name,
    authorTitle: article.author.title,
    reviewerName: article.clinicalReviewer.name,
    reviewerTitle: article.clinicalReviewer.title,
    citations: article.citations.map((c) => `${c.source}: ${c.title}`),
  });

  const medicalWebPageJsonLd = getMedicalWebPageJsonLd({
    title: article.title,
    description: article.description,
    url: `/knowledge/${article.slug}`,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    aspect: article.category,
    citations: article.citations.map((c) => `${c.source}: ${c.title}`),
  });

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      <JsonLd schema={[articleJsonLd, medicalWebPageJsonLd]} />
      <div>
        <PublicNavbar />
        <Breadcrumbs
          items={[
            { label: "Knowledge Hub", href: "/knowledge" },
            { label: article.title, href: `/knowledge/${article.slug}` },
          ]}
        />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10">
          {/* Article Header */}
          <header className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                {article.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                <span>{article.readingTime}</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
              {article.title}
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              {article.subtitle}
            </p>

            {/* Author & Reviewer Attribution Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Author</span>
                  <strong className="text-slate-800 font-semibold">{article.author.name}</strong>
                  <span className="text-slate-500 block">{article.author.title}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Clinical Review</span>
                  <strong className="text-slate-800 font-semibold">{article.clinicalReviewer.name}</strong>
                  <span className="text-slate-500 block">Updated: {article.dateModified}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Key Takeaways Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-blue-50/70 border border-blue-200/80 space-y-4">
            <h2 className="text-base font-bold text-blue-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <span>Key Clinical Takeaways</span>
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-blue-950">
              {article.summaryPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Markdown Article Content */}
          <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm sm:text-base space-y-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight pt-6 pb-2 border-b border-slate-100">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold text-slate-900 pt-4 pb-1">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-slate-700 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1.5 text-slate-700 my-4 pl-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-700 my-4 pl-2">
                    {children}
                  </ol>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-6 rounded-2xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3 bg-slate-50 text-left font-semibold text-slate-900 border-b border-slate-200">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-slate-700 border-b border-slate-100">
                    {children}
                  </td>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="p-4 rounded-2xl bg-amber-50/80 border-l-4 border-amber-500 text-amber-900 text-xs sm:text-sm my-6 italic">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Citations & Evidence Base */}
          <section className="pt-8 border-t border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Evidence Base &amp; References</span>
            </h2>
            <ul className="space-y-2 text-xs text-slate-600">
              {article.citations.map((citation, idx) => (
                <li key={idx} className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="font-semibold text-slate-800">{idx + 1}.</span>
                  <div>
                    <strong className="text-slate-800">{citation.source}:</strong>{" "}
                    <span>{citation.title}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Medical Disclaimer Callout */}
          <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 font-semibold">Educational Healthcare Notice:</strong> This article is authored for general health literacy and informational purposes only. It does not constitute medical advice or substitute for consultation with a qualified healthcare provider.
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Knowledge Hub</span>
            </Link>

            <Link href="/?persona=patient">
              <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs px-6 py-2.5 rounded-xl cursor-pointer">
                <span>Discuss with Aegis</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}
