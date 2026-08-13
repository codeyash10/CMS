import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";
import { auditLogs, hasPermission, userCanAccessCompany } from "@/lib/mock-db";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId || !userCanAccessCompany(user, companyId)) {
    return NextResponse.json({ error: "Forbidden for this company." }, { status: 403 });
  }

  if (!hasPermission(user, "audit.view_all") && !hasPermission(user, "audit.view_company")) {
    return NextResponse.json({ error: "You don't have permission to view audit logs." }, { status: 403 });
  }

  const logs = auditLogs.filter((l) => l.companyId === companyId);
  return NextResponse.json({ logs });
}
