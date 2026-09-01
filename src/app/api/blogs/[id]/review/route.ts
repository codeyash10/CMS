import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getUserFromRequest } from "@/lib/session";
import {
  blogs,
  hasPermission,
  userCanAccessCompany,
  logAudit,
} from "@/lib/mock-db";
import { reviewActionSchema } from "@/lib/schemas/blog";
import { firstZodError } from "@/lib/schemas/zodError";

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
  if (!hasPermission(user, "blog.review")) {
    return NextResponse.json(
      { error: "You don't have permission to review blogs." },
      { status: 403 },
    );
  }
  if (blog.status !== "submitted_for_review") {
    return NextResponse.json(
      { error: `Can't review a blog in "${blog.status}" state.` },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = reviewActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstZodError(parsed.error) },
      { status: 400 },
    );
  }
  const { action, comment } = parsed.data;

  const fromStatus = blog.status;
  blog.status = action === "approve" ? "approved" : "rejected";
  blog.updatedAt = new Date().toISOString();
  blog.reviews.push({
    id: uuid(),
    action,
    reviewerId: user.id,
    comment,
    createdAt: blog.updatedAt,
  });

  logAudit({
    userId: user.id,
    companyId: blog.companyId,
    entityType: "blog",
    entityId: blog.id,
    action: action === "approve" ? "approve" : "reject",
    fromStatus,
    toStatus: blog.status,
    comment,
  });

  return NextResponse.json({ blog });
}
