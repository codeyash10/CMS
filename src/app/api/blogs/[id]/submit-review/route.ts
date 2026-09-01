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
  if (!hasPermission(user, "blog.submit_review")) {
    return NextResponse.json(
      { error: "You don't have permission to submit for review." },
      { status: 403 },
    );
  }
  if (!["draft", "rejected"].includes(blog.status)) {
    return NextResponse.json(
      { error: `Can't submit a blog in "${blog.status}" state for review.` },
      { status: 409 },
    );
  }

  const fromStatus = blog.status;
  blog.status = "submitted_for_review";
  blog.updatedAt = new Date().toISOString();

  logAudit({
    userId: user.id,
    companyId: blog.companyId,
    entityType: "blog",
    entityId: blog.id,
    action: "submit_review",
    fromStatus,
    toStatus: blog.status,
  });

  return NextResponse.json({ blog });
}
