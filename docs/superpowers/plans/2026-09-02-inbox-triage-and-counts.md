# Inbox Triage and Counts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add exact active/Inbox counts and a touch-first Inbox triage flow that advances immediately after a folder or tag assignment.

**Architecture:** Keep exact count queries in the gallery repository and load them with the initial server page. `GalleryShell` owns refreshed counts. A focused `InboxTriage` client component owns a cursor-backed Inbox queue and calls the existing list and batch endpoints, leaving ownership and association validation in the batch repository.

**Tech Stack:** Next.js App Router 16, React 19, TypeScript, Supabase, Vitest, Testing Library, Playwright.

## Global Constraints

- Persist source URLs only; do not proxy, upload, or optimize images.
- Inbox means an active image with no folder and no tag.
- A successful folder or tag assignment advances immediately; failure retains the current image.
- Desktop and mobile controls remain accessible, labelled, and touch-sized.

---

### Task 1: Count data contract

**Files:**
- Modify: `src/features/gallery/types.ts`
- Modify: `src/features/gallery/index.ts`
- Modify: `src/server/gallery/query-repository.ts`
- Modify: `src/app/(gallery)/gallery/page.tsx`
- Test: `tests/unit/gallery-query.test.ts`

**Interfaces:**
- Produces `GalleryCounts = { active: number; inbox: number }`.
- Produces `getGalleryCounts(supabase: SupabaseClient, ownerId: string): Promise<GalleryCounts>`.

- [ ] **Step 1: Write a failing count-contract test**

```ts
it("counts active and Inbox images separately", async () => {
  await expect(getGalleryCounts(fakeSupabase, "owner-1"))
    .resolves.toEqual({ active: 7, inbox: 2 });
});
```

- [ ] **Step 2: Verify the test is red**

Run `npm run test -- tests/unit/gallery-query.test.ts`.
Expected: FAIL because `getGalleryCounts` is not exported.

- [ ] **Step 3: Implement exact active and Inbox count queries**

```ts
export async function getGalleryCounts(supabase: SupabaseClient, ownerId: string): Promise<GalleryCounts> {
  const [active, inbox] = await Promise.all([
    supabase.from("images").select("id", { count: "exact", head: true }).eq("owner_id", ownerId).is("deleted_at", null),
    supabase.from("images").select("id,image_folders!left(image_id),image_tags!left(image_id)", { count: "exact", head: true })
      .eq("owner_id", ownerId).is("deleted_at", null).is("image_folders.image_id", null).is("image_tags.image_id", null),
  ]);
  // Throw query errors and return exact database counts, falling back to zero only for null counts.
}
```

Load counts with page/folders/tags and pass `initialCounts` into `GalleryShell`.

- [ ] **Step 4: Verify green and commit**

Run `npm run test -- tests/unit/gallery-query.test.ts`.
Expected: PASS.

```bash
git add src/features/gallery src/server/gallery/query-repository.ts 'src/app/(gallery)/gallery/page.tsx' tests/unit/gallery-query.test.ts
git commit -m "feat: expose gallery image counts"
```

### Task 2: Toolbar counts and command

**Files:**
- Create: `src/app/api/images/counts/route.ts`
- Modify: `src/components/gallery/gallery-toolbar.tsx`
- Modify: `src/components/gallery/gallery-shell.tsx`
- Test: `tests/unit/gallery-toolbar.test.tsx`

**Interfaces:**
- `GalleryToolbar` consumes `counts: GalleryCounts` and `onOpenInboxTriage(): void`.
- `GalleryShell` provides `refreshCounts(): Promise<void>` via the new authenticated counts endpoint.

- [ ] **Step 1: Write failing toolbar tests**

```tsx
it("displays active and Inbox counts", () => {
  render(<GalleryToolbar {...toolbarProps} counts={{ active: 12, inbox: 3 }} />);
  expect(screen.getByText("12 images")).toBeVisible();
  expect(screen.getByText("3 Inbox")).toBeVisible();
});

it("opens Inbox triage from the mobile menu", () => {
  const onOpenInboxTriage = vi.fn();
  render(<GalleryToolbar {...toolbarProps} onOpenInboxTriage={onOpenInboxTriage} />);
  fireEvent.click(screen.getByRole("button", { name: "Open gallery menu" }));
  fireEvent.click(screen.getByRole("button", { name: "Organize Inbox" }));
  expect(onOpenInboxTriage).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Verify the tests are red**

Run `npm run test -- tests/unit/gallery-toolbar.test.tsx`.
Expected: FAIL because counts and triage command are absent.

- [ ] **Step 3: Implement the command and count refresh endpoint**

```ts
export async function GET() {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(await getGalleryCounts(supabase, user.id));
}
```

Display compact count text beside the desktop title and below the mobile title. Add an icon-labelled `Organize Inbox` control to desktop and mobile. Refresh after saves and successful management mutations.

- [ ] **Step 4: Verify green and commit**

Run `npm run test -- tests/unit/gallery-toolbar.test.tsx`.
Expected: PASS.

```bash
git add src/app/api/images/counts src/components/gallery/gallery-toolbar.tsx src/components/gallery/gallery-shell.tsx tests/unit/gallery-toolbar.test.tsx
git commit -m "feat: display gallery and Inbox counts"
```

### Task 3: Immediate-advance Inbox triage

**Files:**
- Create: `src/components/gallery/inbox-triage.tsx`
- Modify: `src/components/gallery/folder-picker-sheet.tsx`
- Modify: `src/components/gallery/tag-picker-sheet.tsx`
- Modify: `src/components/gallery/gallery-shell.tsx`
- Test: `tests/unit/inbox-triage.test.tsx`
- Test: `tests/e2e/gallery.spec.ts`

**Interfaces:**
- `InboxTriage` consumes `{ open, folders, tags, onClose, onCreateTag, onAssigned }`.
- `onAssigned` resolves only after the existing batch endpoint associates the current image.
- Existing picker sheets accept optional `confirmLabel` for triage wording.

- [ ] **Step 1: Write failing triage tests**

```tsx
it("moves to the next Inbox image after a successful folder assignment", async () => {
  render(<InboxTriage {...props} />);
  await user.click(screen.getByRole("button", { name: "Add folders" }));
  await user.click(screen.getByRole("checkbox", { name: "Reference" }));
  await user.click(screen.getByRole("button", { name: "Organize and continue" }));
  expect(await screen.findByText("second.jpg")).toBeVisible();
});

it("keeps the current image after an assignment failure", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    succeededIds: [], failed: [{ id: "image-1", message: "Update failed." }],
  }), { status: 200 })));
  render(<InboxTriage {...props} />);
  await user.click(screen.getByRole("button", { name: "Add folders" }));
  await user.click(screen.getByRole("checkbox", { name: "Reference" }));
  await user.click(screen.getByRole("button", { name: "Organize and continue" }));
  expect(screen.getByText("first.jpg")).toBeVisible();
  expect(screen.getByText("Update failed.")).toBeVisible();
});
```

- [ ] **Step 2: Verify red**

Run `npm run test -- tests/unit/inbox-triage.test.tsx`.
Expected: FAIL because `InboxTriage` does not exist.

- [ ] **Step 3: Implement triage queue and integrate it**

```tsx
async function assign(action: "folder_add" | "tag_add", targetIds: string[]) {
  const image = queue[0];
  const result = await submitBatch(action, [image.id], targetIds);
  if (!result.succeededIds.includes(image.id)) {
    setError(result.failed[0]?.message ?? "Unable to organize image.");
    return;
  }
  setQueue((current) => current.slice(1));
  await onAssigned();
}
```

Fetch `/api/images?inboxOnly=true` with cursors. Display original image URL, position, close, skip, and full-width folder/tag actions. Prefetch the next page before queue exhaustion. After success, shell reloads visible page and counts. Failure does not advance.

- [ ] **Step 4: Verify green and add acceptance coverage**

Run `npm run test -- tests/unit/inbox-triage.test.tsx`.
Expected: PASS.

Add authenticated E2E coverage that seeds two Inbox images, assigns the first, then asserts second image plus lower Inbox count. Run `npm run test:e2e -- tests/e2e/gallery.spec.ts`; it should pass with configured local E2E settings or skip otherwise.

- [ ] **Step 5: Commit triage**

```bash
git add src/components/gallery tests/unit/inbox-triage.test.tsx tests/e2e/gallery.spec.ts
git commit -m "feat: add Inbox triage mode"
```

### Task 4: Final verification

**Files:**
- Modify only files needed for verification fixes.

- [ ] **Step 1: Run checks**

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

- [ ] **Step 2: Inspect final state**

```bash
git diff origin/main...HEAD --check
git status --short --branch
```

- [ ] **Step 3: Commit any verified fixes**

```bash
git add -u
git commit -m "fix: polish Inbox triage"
```
