import { NextRequest, NextResponse } from "next/server";
import { blogs, companies } from "@/lib/mock-db";

/**
 * PUBLIC API — no auth required, this is what the live brand website calls.
 * Only ever returns status = "published" blogs. This is the seam described
 * in the technical plan: the live site never talks to the CMS's internal
 * data directly, only to this read-only surface.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  const { companySlug } = await params;
  const company = companies.find((c) => c.slug === companySlug);
  if (!company) return NextResponse.json({ error: "Unknown company." }, { status: 404 });

  const published = blogs
    .filter((b) => b.companyId === company.id && b.status === "published")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .map((b) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt,
      content: b.content,
      coverImageUrl: b.coverImageUrl,
      tags: b.tags,
      metaTitle: b.metaTitle,
      metaDescription: b.metaDescription,
      publishedAt: b.publishedAt,
    }));

  return NextResponse.json({ company: company.slug, blogs: published });
}
