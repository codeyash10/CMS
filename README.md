# Crediple Blog CMS — Frontend (Mock Backend)

A working Next.js scaffold for the Blog module: login, RBAC, the full
Draft → Review → Approve/Reject → Publish workflow, and a public read API
simulating how the live brand site would pull published posts.

The backend here is **mocked in-memory** inside Next.js API routes
(`app/api/**`) so frontend development isn't blocked on the real backend
team. Everything is built to match the API contract in the technical plan,
so swapping in the real backend later should mean changing the *inside* of
the API route handlers (or just pointing `lib/api.ts` at a different base
URL), not rewriting any pages or components.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll land on `/login`.

## Demo accounts

All passwords: `password123`

| Role | Email | Company access |
|---|---|---|
| Super Admin | ava.superadmin@crediple.com | Crediple, Brand One |
| Company Admin | liam.admin@crediple.com | Crediple |
| Content Editor | priya.editor@crediple.com | Crediple |
| Content Reviewer | omar.reviewer@crediple.com | Crediple |
| Company Admin (2nd brand) | sofia.admin@brandone.com | Brand One |

Try logging in as the editor, writing a draft, submitting it, then logging
in as the reviewer to approve it, then as the admin to publish it. Check
`/api/public/crediple/blogs` in the browser afterward — that's the
"live site" view.

## What's mocked vs. real

- **Mocked:** the database (in-memory arrays in `lib/mock-db.ts`), auth
  (cookie + in-memory session map instead of JWT + real password hashing).
  Data resets whenever the dev server restarts.
- **Real / production-shaped:** the API route contracts, RBAC permission
  checks, workflow state machine, audit logging, and the separation between
  the internal blog API and the public read-only API.

## Project structure

```
app/
  api/                      → mock backend (route handlers)
    auth/login, logout, me
    blogs/, blogs/[id]/, blogs/[id]/{submit-review,review,publish,unpublish}
    blog-categories/
    companies/
    dashboard/summary/
    users/
    audit-logs/
    public/[companySlug]/blogs   → what the live site would call
  login/                    → login page
  (app)/                    → everything behind auth
    dashboard/
    blogs/, blogs/new/, blogs/[id]/
    review/                 → review queue (reviewers)
    publish/                → publish queue (publishers)
    users/                  → admin only
    audit-logs/

components/
  AuthProvider.tsx           → session/permission state, used everywhere
  AppShell.tsx                → sidebar + company switcher
  RequirePermission.tsx      → hides UI the user can't use (UX only — backend re-checks everything)
  BlogForm.tsx                → shared create/edit form
  StatusBadge.tsx

lib/
  mock-db.ts                  → seeded data + RBAC permission map
  session.ts                  → cookie/session helpers
  api.ts                       → fetch wrapper used by all pages
```

## RBAC model

Permissions are atomic strings (`blog.create`, `blog.review`,
`blog.publish`, etc.) mapped to roles in `ROLE_PERMISSIONS` inside
`lib/mock-db.ts`. Roles are not hardcoded into business logic anywhere else
— every check in the API routes asks "does this user have permission X",
not "is this user role Y". Renaming or reconfiguring roles later is a
data change, not a code change.

**Every permission check happens twice:** once in the frontend (via
`RequirePermission` and `hasPermission()`, purely to hide buttons the user
can't use) and once in the backend API route (the actual security
boundary). Don't rely on the frontend check alone when wiring up the real
backend.

## Swapping in the real backend

1. Point `lib/api.ts`'s `fetch` calls at the real backend's base URL (or
   keep hitting `/api/*` on this app if you put a proxy/rewrite in
   `next.config.js`).
2. If the real backend uses bearer tokens instead of cookies, update
   `lib/api.ts` to attach an `Authorization` header instead of relying on
   `credentials: "include"`.
3. Delete `app/api/**` (or leave it as a local fallback/demo mode).
4. Everything else — pages, components, RBAC UI gating — should keep working
   unchanged, since they only depend on the shapes already returned here
   (`{ user }`, `{ blog }`, `{ blogs }`, `{ logs }`, etc.).

## Known gaps (intentionally out of scope for this pass)

- No rich text editor yet — blog content is a raw HTML textarea. Swap in
  TipTap or similar once the backend's content storage format is settled.
- No media upload — cover images are a URL field for now.
- No notifications (email/in-app) on workflow transitions.
- No pagination on blog lists — fine at mock-data scale, will matter with
  real volume.
- Company Admin's "all companies" super-admin exception in
  `app/api/users/route.ts` checks for a `"__all__"` sentinel that isn't
  actually seeded — replace with a real "is super admin" check when wiring
  to the real backend's user model.
