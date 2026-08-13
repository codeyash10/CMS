import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";
import { blogCategories, userCanAccessCompany } from "@/lib/mock-db";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId || !userCanAccessCompany(user, companyId)) {
    return NextResponse.json({ error: "Forbidden for this company." }, { status: 403 });
  }

  return NextResponse.json({
    categories: blogCategories.filter((c) => c.companyId === companyId),
  });
}
