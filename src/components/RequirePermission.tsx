"use client";

import { useAuth } from "./AuthProvider";

/**
 * UX-only gate — hides controls the user can't use. The backend
 * independently re-checks every permission on every request, so this
 * component is never the actual security boundary.
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) return null;
  return <>{children}</>;
}
