import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";
import { companies } from "@/lib/mock-db";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const visible = companies.filter((c) => user.companyIds.includes(c.id));
  return NextResponse.json({ companies: visible });
}
