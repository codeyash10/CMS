"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", permission: null },
  { href: "/blogs", label: "Blogs", permission: null },
  { href: "/review", label: "Review queue", permission: "blog.review" },
  { href: "/publish", label: "Publish queue", permission: "blog.publish" },
  { href: "/users", label: "Users", permission: "user.manage" },
  { href: "/audit-logs", label: "Audit log", permission: "audit.view_company" },
  { href: "/change-password", label: "Change password", permission: null },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, hasPermission, logout, activeCompanyId, setActiveCompanyId } =
    useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] bg-canvas">
      <aside className="bg-[#0c1a35] text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
            Crediple
          </p>
          <p className="font-heading font-semibold">Blog CMS</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.filter(
            (item) => !item.permission || hasPermission(item.permission),
          ).map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent text-white font-medium"
                    : "text-white/65 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-white/40">{user.role?.label}</p>
          </div>
          <button
            onClick={() => logout()}
            className="w-full text-left rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="h-14 border-b border-line bg-panel flex items-center justify-end gap-3 px-6">
          {user.companies.length > 1 ? (
            <select
              value={activeCompanyId ?? ""}
              onChange={(e) => setActiveCompanyId(e.target.value)}
              className="text-sm border border-line rounded-lg px-2.5 py-1.5 bg-panel text-ink outline-none focus:border-accent"
            >
              {user.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-ink/60">
              {user.companies[0]?.name}
            </span>
          )}
          <ThemeToggle />
        </header>

        <main className="flex-1 px-8 py-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
