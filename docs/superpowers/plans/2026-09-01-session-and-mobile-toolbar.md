# Session And Mobile Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reliable logout and a compact mobile gallery toolbar that exposes all gallery actions.

**Architecture:** `POST /auth/sign-out` uses the established server Supabase client and redirects to `/login`. `GalleryToolbar` keeps the inline control row at `sm` and wider, while narrower viewports use a title/menu row, a full-width search row, and the existing `Sheet` component for gallery actions.

**Tech Stack:** Next.js App Router, Supabase SSR, React 19, Tailwind CSS, lucide-react, Vitest, Testing Library, Playwright.

## Global Constraints

- Keep Google OAuth as the only sign-in method.
- Use existing `IconButton` and `Sheet` UI primitives with lucide icons.
- Use Tailwind's `sm` breakpoint for the compact toolbar.
- Do not modify image, folder, tag, or database data.

---

### Task 1: Server Sign-Out Route

**Files:**
- Create: `src/app/auth/sign-out/route.ts`
- Create: `tests/unit/sign-out-route.test.ts`

**Interfaces:**
- Consumes: `createServerSupabaseClient()` from `src/lib/supabase/server.ts`.
- Produces: `POST(request: NextRequest)` at `/auth/sign-out`.

- [ ] **Step 1: Write the failing route test**

```ts
const authMocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: authMocks.createServerSupabaseClient,
}));

it("clears the session and redirects to login", async () => {
  authMocks.createServerSupabaseClient.mockResolvedValue({
    auth: { signOut: authMocks.signOut },
  });
  authMocks.signOut.mockResolvedValue({ error: null });

  const response = await POST(new NextRequest("https://app.test/auth/sign-out", { method: "POST" }));

  expect(authMocks.signOut).toHaveBeenCalledWith();
  expect(response.headers.get("location")).toBe("https://app.test/login");
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm run test -- tests/unit/sign-out-route.test.ts`

Expected: the route module cannot be resolved.

- [ ] **Step 3: Implement the route**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  await (await createServerSupabaseClient()).auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
```

- [ ] **Step 4: Verify the test passes**

Run: `npm run test -- tests/unit/sign-out-route.test.ts`

Expected: one passing test.

- [ ] **Step 5: Commit the route**

```bash
git add src/app/auth/sign-out/route.ts tests/unit/sign-out-route.test.ts
git commit -m "feat: add server sign-out route"
```

### Task 2: Responsive Toolbar And Logout Controls

**Files:**
- Modify: `src/components/gallery/gallery-toolbar.tsx`
- Create: `tests/unit/gallery-toolbar.test.tsx`

**Interfaces:**
- Consumes: the existing gallery callback props and `GalleryView` type.
- Produces: `Open gallery menu` on mobile, a `Gallery menu` sheet, and logout forms posting to `/auth/sign-out`.

- [ ] **Step 1: Write failing toolbar tests**

```tsx
const toolbarProps = {
  mode: "viewer" as const,
  onModeChange: vi.fn(),
  onOpenAddUrl: vi.fn(),
  onOpenFilters: vi.fn(),
  onSearchChange: vi.fn(),
  onViewChange: vi.fn(),
  search: "",
  view: "masonry" as const,
};

it("opens the mobile menu and starts image addition", () => {
  const onOpenAddUrl = vi.fn();
  render(<GalleryToolbar {...toolbarProps} onOpenAddUrl={onOpenAddUrl} />);

  fireEvent.click(screen.getByRole("button", { name: "Open gallery menu" }));
  fireEvent.click(screen.getByRole("button", { name: "Add image URL" }));

  expect(onOpenAddUrl).toHaveBeenCalledWith();
  expect(screen.queryByRole("dialog", { name: "Gallery menu" })).not.toBeInTheDocument();
});

it("posts logout through the server route", () => {
  render(<GalleryToolbar {...toolbarProps} />);
  const button = screen.getAllByRole("button", { name: "Log out" })[0];

  expect(button.closest("form")).toHaveAttribute("action", "/auth/sign-out");
  expect(button.closest("form")).toHaveAttribute("method", "post");
});
```

- [ ] **Step 2: Verify the toolbar tests fail**

Run: `npm run test -- tests/unit/gallery-toolbar.test.tsx`

Expected: no `Open gallery menu` or `Log out` controls are present.

- [ ] **Step 3: Implement compact and inline toolbar variants**

```tsx
const [menuOpen, setMenuOpen] = useState(false);
const closeThen = (callback: () => void) => {
  setMenuOpen(false);
  callback();
};

<div className="sm:hidden">
  <div className="flex min-h-14 items-center justify-between">
    <h1>Link Gallery</h1>
    <IconButton label="Open gallery menu" onClick={() => setMenuOpen(true)}>
      <Menu size={18} />
    </IconButton>
  </div>
  <label className="relative block pb-2">
    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={18} />
    <input aria-label="Search images" className="h-10 w-full border border-slate-300 bg-white pl-10 pr-3 text-sm" onChange={(event) => onSearchChange(event.target.value)} value={search} />
  </label>
  <Sheet onClose={() => setMenuOpen(false)} open={menuOpen} title="Gallery menu">
    <button onClick={() => closeThen(onOpenAddUrl)} type="button">Add image URL</button>
    <button onClick={() => closeThen(onOpenFilters)} type="button">Filters</button>
    <button onClick={() => closeThen(() => onViewChange("masonry"))} type="button">Masonry view</button>
    <button onClick={() => closeThen(() => onViewChange("square"))} type="button">Square grid view</button>
    <form action="/auth/sign-out" method="post"><IconButton label="Log out"><LogOut size={18} /></IconButton></form>
  </Sheet>
</div>
```

Render the current desktop controls in a sibling `hidden sm:flex` section, add the same logout form there, and include the management-mode callback in the mobile menu through `closeThen`.

- [ ] **Step 4: Verify the toolbar tests pass**

Run: `npm run test -- tests/unit/gallery-toolbar.test.tsx`

Expected: both tests pass.

- [ ] **Step 5: Commit the toolbar work**

```bash
git add src/components/gallery/gallery-toolbar.tsx tests/unit/gallery-toolbar.test.tsx
git commit -m "feat: add mobile gallery menu and logout"
```

### Task 3: Acceptance Verification

**Files:**
- Modify: `tests/e2e/gallery.spec.ts`

**Interfaces:**
- Consumes: `/auth/sign-out` and the responsive `GalleryToolbar` from Tasks 1 and 2.
- Produces: an authenticated mobile acceptance scenario.

- [ ] **Step 1: Add the mobile acceptance scenario**

```ts
test("opens the mobile gallery menu and signs out", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(galleryUrl());

  await page.getByRole("button", { name: "Open gallery menu" }).click();
  await expect(page.getByRole("dialog", { name: "Gallery menu" })).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/login$/);
});
```

- [ ] **Step 2: Run authenticated acceptance coverage**

Run: `npx playwright test tests/e2e/gallery.spec.ts --grep "opens the mobile gallery menu and signs out"`

Expected: PASS with the documented E2E Auth environment; otherwise the suite records its existing authenticated-test skip.

- [ ] **Step 3: Run full verification and commit**

Run: `npm run lint && npm run test && npm run build && npx playwright test`

Expected: lint, unit tests, and build pass; Playwright passes or reports only documented authenticated-test skips.

```bash
git add tests/e2e/gallery.spec.ts
git commit -m "test: cover mobile gallery logout"
```
