import { v4 as uuid } from "uuid";
import { NextRequest } from "next/server";
import { sessions, users, User } from "./mock-db";

export const SESSION_COOKIE = "cms_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours, mirrors a real access/refresh window for the mock

export function createSession(userId: string) {
  const id = uuid();
  sessions.set(id, { id, userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return id;
}

export function destroySession(sessionId: string) {
  sessions.delete(sessionId);
}

export function getUserFromRequest(req: NextRequest): User | null {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  return users.find((u) => u.id === session.userId) ?? null;
}
