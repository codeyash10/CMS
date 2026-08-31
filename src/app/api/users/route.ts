import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";
import { users, roles, hasPermission } from "@/lib/mock-db";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!hasPermission(user, "user.manage")) {
    return NextResponse.json(
      { error: "You don't have permission to view users." },
      { status: 403 },
    );
  }

  // Super Admin sees everyone; Company Admin sees users sharing at least one of their companies.
  const visible = user.companyIds.includes("__all__")
    ? users
    : users.filter((u) =>
        u.companyIds.some((cid) => user.companyIds.includes(cid)),
      );

  const withRole = visible.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    companyIds: u.companyIds,
    role: roles.find((r) => r.id === u.roleId) ?? null,
  }));

  return NextResponse.json({ users: withRole });
}
