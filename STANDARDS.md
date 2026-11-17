# React + Next.js Coding Standard

Baseline for React frontends. Stack: **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript 5 (strict)**,
**shadcn/ui** (new-york, on **Base UI**), **Tailwind CSS v4**, **react-hook-form + zod**, **sonner** (toasts),
**lucide-react** (icons), **next-themes**, **pnpm**, **Vitest**.
The directory layout and patterns follow `receivable-ui`. `src/app/admin/users` + `src/lib/user-api.ts` is the
reference feature — copy its shape for new features.

> Review markers: items tagged **[DECISION]** are choices worth confirming as a team.

---

## 1. Project layout

```
src/
  app/                       routes (App Router). One folder per URL segment.
    layout.tsx               root layout: fonts, <ThemeProvider>, <Toaster>, providers
    globals.css              the ONLY stylesheet: design tokens + Tailwind wiring
    page.tsx, not-found.tsx
    admin/                   one area (console) = one route segment with its own layout.tsx
      layout.tsx             shell: sidebar, topbar, auth guard
      users/                 one feature = one route folder
        page.tsx             route entry: metadata + renders the view (thin)
        users-view.tsx       "use client" page body: state, fetching, table
        user-form-dialog.tsx route-private components live next to the page
        confirm-delete-dialog.tsx
        [id]/page.tsx        detail route; new/page.tsx for a full-page create form
    (group)/                 route groups to share a layout without a URL segment
  components/
    ui/                      shadcn/ui primitives + small custom primitives (field-error, amount, …)
    <area>/                  components shared across pages of one area (admin/app-sidebar.tsx, …)
    <domain>/                components shared across areas (invoice/, attachment/, brand/)
    *-provider.tsx           React context providers (theme-provider.tsx, auth-provider.tsx)
  hooks/                     shared hooks: use-<thing>.ts (use-debounced-value.ts, use-customer-options.ts)
  lib/
    api.ts                   the only fetch() caller + envelope types + ApiError
    <entity>-api.ts          typed endpoints + DTO types for one entity (user-api.ts, invoice-api.ts)
    utils.ts                 cn()
    format.ts                date / number / money formatting
    nav.ts                   navigation items
    <domain>.ts              pure domain helpers (permissions.ts, aging.ts, period.ts)
    *.test.ts                unit tests next to the code
public/                      static assets (public/brand/ for logos)
```

- **[DECISION] Feature code lives in its route folder** (`app/<area>/<feature>/`); only code reused by other routes moves
  to `components/`, `hooks/` or `lib/`. API calls and types always live in `lib/<entity>-api.ts`.
- **File names are kebab-case** (`user-form-dialog.tsx`, `use-debounced-value.ts`). Components are PascalCase exports.
- Import across folders with `@/` (`@/lib/api`, `@/components/ui/button`); relative imports (`./`) only inside a route folder.
- No `src/pages/`, `src/features/`, `src/services/` or `src/store/` folders.

## 2. Components

- Function components with **named exports** (`export function UserFormDialog`). `page.tsx` / `layout.tsx` /
  `not-found.tsx` use `export default` (Next.js requires it).
- Props are an `interface <Component>Props` above the component; document non-obvious props with `/** … */`.
- `import * as React from "react"` and `React.useState`, `React.useEffect`, … (as in shadcn/ui).
- **Server components by default.** Add `"use client"` only to files that use state, effects, browser APIs or handlers.
  `page.tsx` stays a server component (exports `metadata`) and renders a `<feature>-view.tsx` client component.
- Dialogs are **controlled**: `open`, `onOpenChange`, plus a result callback (`onSaved`, `onConfirm`). The parent owns
  `open` state and which row is being edited. Dialogs reset their form when they open.
- Keep files under ~300 lines; split sub-components (e.g. `UsersTable`) into the same file first, then into a sibling file.
- Icons from `lucide-react` with `aria-hidden`; icon-only buttons need `aria-label`.

## 3. Styling: shadcn/ui first, then Tailwind

1. **Use a shadcn/ui component** (`@/components/ui/*`). Missing one? Add it with the shadcn CLI
   (`pnpm dlx shadcn@latest add <name>`), then adjust it to the tokens.
2. Only when no component or variant covers it, **use Tailwind utility classes**.
3. **Never** inline or custom CSS (ESLint fails the build):

| Banned            | Example                               | ESLint rule             |
| ----------------- | ------------------------------------- | ----------------------- |
| Inline CSS        | `<div style={{ color: "red" }}>`      | `no-restricted-syntax`  |
| `<style>` blocks  | `<style>{`.x{}`}</style>`             | `no-restricted-syntax`  |
| CSS files/imports | `import "./x.css"`, CSS Modules, SCSS | `no-restricted-imports` |

- Use **semantic token utilities** only (`bg-primary`, `text-muted-foreground`, `text-destructive`, `bg-card`,
  `border-input`), never hex codes or raw palette classes for brand colours. Tokens are defined once in
  `src/app/globals.css` (`:root` light, `.dark` dark, `@theme inline` → utilities). Rebrand there only.
- Variants belong in the component (`cva` in `ui/button.tsx`), not repeated class strings at call sites.
- Merge classes with `cn()` (`@/lib/utils`); conditional classes via `cn("base", active && "bg-accent")`.
- Dark mode via `next-themes` (`class` strategy) — every token has a `.dark` value.
- Prettier sorts Tailwind classes (`prettier-plugin-tailwindcss`).

## 4. Data fetching and state

- Client-side fetching in the view component (the API needs the browser's bearer token).
- One discriminated union per list, so every list renders **loading, empty and error** states:
  ```ts
  type ListState =
    | { kind: "loading" }
    | { kind: "ok"; items: UserOutput[]; pagination: PaginationOutput }
    | { kind: "error"; message: string };
  ```
- Abort superseded requests with an `AbortController` held in a `useRef`; ignore results after `signal.aborted`.
- Debounce search inputs (`useDebouncedValue`, 250–300 ms) and reset to page 1 when the search changes.
- After a write: update or refetch the list; after deleting the last row on a page, step back a page.
- Reusable data hooks (option lists for comboboxes, etc.) go in `hooks/use-<thing>.ts`.
- Cross-cutting state (auth user, permissions, branding) lives in a context provider in `components/*-provider.tsx`
  with a `use<Thing>()` hook that throws outside the provider. **[DECISION]** No global store library (Redux, Zustand)
  and no query library until a real need appears.

## 5. API layer

- `lib/api.ts` is the **only** module that calls `fetch`. It:
  - calls `/api/v1` on the page's own origin (override with `NEXT_PUBLIC_API_BASE_URL`); `next dev` proxies `/api` to
    `API_PROXY_TARGET` (default `http://localhost:8080`), production uses nginx — **never hard-code an API URL**,
  - adds JSON headers and `Authorization: Bearer <token>` from `localStorage`,
  - reads the standard envelope `{ code, message, errors, data?, timestamp }`,
  - throws `ApiError` (`status`, `code`, `message`, `errors`, `fieldMap`, `requestId` from `X-Request-ID`) for every
    failure, including `NETWORK_ERROR` and `ABORTED`.
- `lib/<entity>-api.ts` exports the DTO types and an `<entity>Api` object (`userApi.list/get/create/update/remove`)
  that returns `data` from the envelope (`unwrap`). Delete returns the backend's message.
- Types mirror the backend DTOs exactly — **same names** (`CreateUserInput`, `UpdateUserInput`, `ListUsersInput`,
  `UserOutput`) and **snake_case fields** — so there is no mapping layer.
- Lists use `ListOutput<T>` = `{ items, pagination: { page, page_size, total_items, total_pages } }`.

## 6. Forms and feedback

- `react-hook-form` + `zodResolver(schema)`; `type Values = z.infer<typeof schema>`. Schemas mirror the backend
  `validate` tags; **the server is the source of truth**.
- `<form noValidate onSubmit={handleSubmit(onSubmit)}>`; each field = `<Label htmlFor>` + `<Input aria-invalid
aria-describedby>` + `<FieldError id>`.
- Server errors: `VALIDATION_ERROR` (422) → `setError` per field from `err.fieldMap`; `CONFLICT` (409) → `setError` on the
  unique field; anything else → a form-level `<FieldError role="alert">`.
- Submit button is `disabled` with a spinning `Loader2Icon` while submitting.
- Success and failure of row actions → `toast.success` / `toast.error` (sonner). Use `errorMessage(err, fallback)`.
- Destructive actions always confirm in a dialog with a `destructive` button.

## 7. Routing

- File-based (App Router). URL segments are kebab-case and plural for collections (`/admin/invoice-categories`).
- Each area (`/admin`, `/platform`) has its own `layout.tsx` (shell + auth guard) and login route.
- Every `page.tsx` exports `metadata` (`{ title: "Users" }`); the root layout's title template adds the app name.
- Navigate with `<Link href>` / `useRouter().push`; sidebar items come from `lib/nav.ts`.
- Dynamic segments: `[id]/page.tsx`. Use route groups `(name)/` to share a layout without changing the URL.

## 8. TypeScript

- `strict` + `noUncheckedIndexedAccess`. No `any` (lint error); use `unknown` and narrow.
- `import type` for type-only imports (enforced, separate statements).
- `interface` for object shapes and props, `type` for unions.
- Only `NEXT_PUBLIC_*` variables reach the browser (inlined at build) — never secrets. Every variable is listed in
  `.env.example`.

## 9. Testing

- Vitest + jsdom, files named `*.test.ts(x)` next to the code.
- Test `lib/` logic (API client, formatting, domain helpers) and complex hooks. Mock `fetch` at the boundary with
  `vi.stubGlobal("fetch", …)`.
- **[DECISION]** No component tests (Testing Library) or E2E (Playwright) yet.

## 10. Tooling

| Command           | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `pnpm dev`        | Dev server on :3000, proxies `/api` → :8080  |
| `pnpm build`      | Production build (`output: "standalone"`)    |
| `pnpm lint`       | ESLint (incl. the styling rules)             |
| `pnpm type-check` | `tsc --noEmit`                               |
| `pnpm format`     | Prettier (+ Tailwind class sorting)          |
| `pnpm test`       | Vitest                                       |
| `pnpm check`      | format:check + lint + type-check + test (CI) |

- Node 22 (`.nvmrc`), pnpm (version pinned in `packageManager`).
- Prettier: double quotes, semicolons, trailing commas, width 100.
- Docker: 3-stage build (deps → builder → runner) running `.next/standalone/server.js` as a non-root user.
  Do not bake `NEXT_PUBLIC_API_BASE_URL` into the image; let the reverse proxy route `/api`.

## 11. Adding a new feature (checklist)

1. `lib/<entity>-api.ts`: DTO types with the backend's names + snake_case fields, and the `<entity>Api` object.
2. `app/<area>/<feature>/page.tsx` (metadata) + `<feature>-view.tsx` (client view with `ListState`).
3. Form dialog (`<entity>-form-dialog.tsx`, zod schema mirroring the backend) and `confirm-delete-dialog.tsx`.
4. Add the page to `lib/nav.ts`.
5. Add tests for any new logic in `lib/`.
6. No `style`, `<style>` or CSS imports — `pnpm check` passes.

## Not included yet (add when needed)

Auth (`components/auth-provider.tsx` + `use-auth-guard.ts` + login route, as in receivable-ui), permissions
(`lib/permissions.ts`, `can()`), i18n, component/E2E tests, runtime response validation with zod.
