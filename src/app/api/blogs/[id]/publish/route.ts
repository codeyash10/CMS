import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";
import {
  blogs,
  hasPermission,
  userCanAccessCompany,
  logAudit,
} from "@/lib/mock-db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const blog = blogs.find((b) => b.id === id);
  if (!blog)
    return NextResponse.json({ error: "Blog not found." }, { status: 404 });
  if (!userCanAccessCompany(user, blog.companyId)) {
    return NextResponse.json(
      { error: "Forbidden for this company." },
      { status: 403 },
    );
  }
  if (!hasPermission(user, "blog.publish")) {
    return NextResponse.json(
      { error: "You don't have permission to publish." },
      { status: 403 },
    );
  }
  if (blog.status !== "approved") {
    return NextResponse.json(
      {
        error: `Only approved blogs can be published. This one is "${blog.status}".`,
      },
      { status: 409 },
    );
  }

  const fromStatus = blog.status;
  blog.status = "published";
  blog.publishedAt = new Date().toISOString();
  blog.updatedAt = blog.publishedAt;

  logAudit({
    userId: user.id,
    companyId: blog.companyId,
    entityType: "blog",
    entityId: blog.id,
    action: "publish",
    fromStatus,
    toStatus: blog.status,
  });

  // In the real backend, this is the point where a webhook would fire to the
  // live website (or its cache) telling it this blog is now available at
  // GET /public/:companySlug/blogs/:slug. See app/api/public for the mock
  // equivalent of that public read API.

  return NextResponse.json({ blog });
}
