import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, publicUserView } from "@/lib/mock-db";
import { createSession, SESSION_COOKIE } from "@/lib/session";
import { loginSchema } from "@/lib/schemas/auth";
import { firstZodError } from "@/lib/schemas/zodError";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstZodError(parsed.error) },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  const user = findUserByEmail(email);
  if (!user || user.password !== password || !user.isActive) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const sessionId = createSession(user.id);
  const res = NextResponse.json({ user: publicUserView(user) });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
