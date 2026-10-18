import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { JsonLd, getBreadcrumbJsonLd } from "@/components/seo/JsonLd";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const allItems = [{ label: "Home", href: "/" }, ...items];
  const breadcrumbSchema = getBreadcrumbJsonLd(
    allItems.map((i) => ({ name: i.label, url: i.href }))
  );

  return (
    <>
      <JsonLd schema={breadcrumbSchema} />
      <nav aria-label="Breadcrumb" className="py-3 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
        <ol className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />}
                {index === 0 && <Home className="h-3 w-3 text-slate-400 mr-0.5 shrink-0" />}
                {isLast ? (
                  <span className="font-medium text-slate-800" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
