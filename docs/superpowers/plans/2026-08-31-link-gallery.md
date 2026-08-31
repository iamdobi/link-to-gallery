# Link Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private, responsive gallery that saves only external image URLs and organizes them with folders and tags.

**Architecture:** A Next.js App Router application uses Supabase Auth for Google sign-in and Postgres with RLS for all data. Server-side repositories validate and mutate gallery data; client components own gallery state, touch interaction, and direct external image rendering. Images are never proxied or stored by the application.

**Tech Stack:** Next.js, TypeScript, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Zod, TanStack Virtual, Lucide React, Vitest, Playwright, Supabase CLI/pgTAP, Vercel.

## Global Constraints

- Store only the original external HTTP(S) image URL; do not download, proxy, optimize, or generate image thumbnails.
- Use Google OAuth only, and reject non-allowlisted emails before auth-user creation.
- Enforce ownership in Supabase RLS; never rely on client filtering for privacy.
- Preserve the exact submitted URL for display/opening while using a normalized fingerprint only for duplicate detection.
- Default to Viewer mode; Management mode is an explicit, touch-friendly selection workflow.
- Support nested folders, multiple folders per image, and multiple tags per image.
- Use cursor pagination with 48 items per page, lazy image loading, square-grid virtualization, and bounded masonry rendering.
- Use native `<img>` elements, not Next Image.
- Keep all added source, docs, and UI copy ASCII unless an existing file requires otherwise.
- Organize code by `images`, `folders`, `tags`, `gallery`, and `capture` feature boundaries; cross-feature imports use only each feature's `index.ts` public exports.
- Keep App Router routes thin: they authenticate and compose modules but contain no persistence, normalization, selection-state, or gesture rules.
- Keep `src/lib` framework-independent and `components/ui` limited to genuinely reusable visual primitives; do not create generic abstractions for one caller.
- Give each repository one persistence responsibility and each component one interaction or presentation responsibility. Split a module once it owns persistence, transformation, interaction state, and rendering at the same time.

---

## Planned File Structure

```text
app/
  (auth)/login/page.tsx                    Google login page
  auth/callback/route.ts                   OAuth code exchange
  (gallery)/gallery/page.tsx               Protected gallery route
  capture/page.tsx                         Bookmarklet confirmation route
  api/images/route.ts                      Create/query image API
  api/images/[id]/route.ts                 Image status, note, trash API
  api/images/batch/route.ts                Batch relationship/trash API
  api/folders/route.ts                     Folder API
  api/tags/route.ts                        Tag API
components/
  ui/*                                     Reusable visual primitives only
  gallery/*                                Viewer, management, and image components
  capture/*                                Bookmarklet confirmation components
src/
  lib/{url,bookmarklet,gesture}.ts         Pure domain helpers
  lib/supabase/{browser,server,middleware}.ts
  server/gallery/{image,folder,tag,batch,query}-repository.ts
  features/images/{types,service,index}.ts Image-domain public contract
  features/folders/{types,service,index}.ts Folder-domain public contract
  features/tags/{types,service,index}.ts   Tag-domain public contract
  features/gallery/{types,use-gallery-state,index}.ts
  features/capture/{types,service,index}.ts Capture-domain public contract
supabase/
  migrations/*.sql                         Schema, RLS, functions, auth hook
  tests/*.test.sql                         pgTAP database tests
tests/unit/*.test.ts                       Pure helper tests
tests/e2e/*.spec.ts                        Browser tests
```

### Task 1: Scaffold the application and quality toolchain

**Files:**
- Create: `package.json`, `app/layout.tsx`, `app/page.tsx`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Produces an App Router project with `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build`.

- [ ] **Step 1: Create the Next.js App Router project**

Run the generator in an empty temporary directory because this repository already contains approved design documents:

```bash
scaffold_dir=$(mktemp -d)
npx create-next-app@latest "$scaffold_dir" --ts --eslint --app --src-dir --use-npm --import-alias '@/*' --yes
rsync -a --exclude '.git' --exclude 'README.md' --exclude '.gitignore' "$scaffold_dir/" ./
```

- [ ] **Step 2: Add test and UI dependencies**

Run: `npm install @supabase/ssr @supabase/supabase-js @tanstack/react-virtual zod lucide-react clsx`

Run: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test`

- [ ] **Step 3: Add a smoke test before implementation**

Create `tests/unit/app-shell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

it('renders the private gallery entry point', () => {
  render(<HomePage />);
  expect(screen.getByRole('heading', { name: /link gallery/i })).toBeInTheDocument();
});
```

- [ ] **Step 4: Implement the minimal app shell and test configuration**

Render a `Link Gallery` heading from `app/page.tsx`, configure jsdom and `@testing-library/jest-dom` in Vitest, and add npm scripts for lint, unit test, E2E test, and build.

- [ ] **Step 5: Verify and commit**

Run: `npm run lint && npm run test && npm run build`

Commit: `git add . && git commit -m "chore: scaffold link gallery app"`

### Task 2: Create the Supabase schema, RLS, and allowlist hook

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/202608310001_gallery_schema.sql`, `supabase/tests/0001_gallery_schema.test.sql`, `docs/supabase-setup.md`
- Modify: `.env.example`, `README.md`

**Interfaces:**
- Produces `images`, `folders`, `image_folders`, `tags`, `image_tags`, and `allowed_emails`.
- Produces `public.before_user_created_allowlist(event jsonb) returns jsonb` for Supabase Auth.

- [ ] **Step 1: Write failing pgTAP checks for the data contract**

Create tests asserting that an unapproved email is rejected and that two image-folder links with the same pair cannot coexist:

```sql
select is(
  public.before_user_created_allowlist(
    jsonb_build_object('user', jsonb_build_object('email', 'blocked@example.com'))
  ) -> 'error' ->> 'http_code',
  '403',
  'rejects a non-allowlisted email'
);
```

- [ ] **Step 2: Run the database test to verify it fails**

Run: `supabase test db --file supabase/tests/0001_gallery_schema.test.sql`

Expected: FAIL because the schema and hook do not exist.

- [ ] **Step 3: Write the migration**

Create the six tables with owner columns, unique constraints, indexes for active-image cursor queries, RLS policies, and the allowlist function. The hook must return:

```sql
jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Access denied.'))
```

for a missing normalized email. Grant only `supabase_auth_admin` execute permission on the hook and revoke it from client roles.

- [ ] **Step 4: Apply and verify locally**

Run: `supabase db reset && supabase test db --file supabase/tests/0001_gallery_schema.test.sql`

Expected: PASS.

- [ ] **Step 5: Document production configuration and commit**

Document Google provider setup, the Before User Created hook assignment, seeded owner email replacement, redirect URLs, and required environment variables. Commit: `git add supabase docs .env.example README.md && git commit -m "feat: add gallery schema and access control"`

### Task 3: Add Supabase clients, middleware, and OAuth callback

**Files:**
- Create: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `middleware.ts`, `app/(auth)/login/page.tsx`, `app/auth/callback/route.ts`, `tests/unit/auth-redirect.test.ts`

**Interfaces:**
- Produces `createBrowserSupabaseClient()`, `createServerSupabaseClient()`, and `updateSupabaseSession(request)`.
- Protected routes redirect unauthenticated visitors to `/login`.

- [ ] **Step 1: Write a failing redirect test**

```ts
import { getSafeNextPath } from '@/src/lib/supabase/middleware';

it('keeps only local post-login paths', () => {
  expect(getSafeNextPath('/gallery')).toBe('/gallery');
  expect(getSafeNextPath('https://attacker.example')).toBe('/gallery');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- auth-redirect.test.ts`

Expected: FAIL because `getSafeNextPath` is undefined.

- [ ] **Step 3: Implement auth boundaries**

Implement cookie-aware server and middleware clients, `getSafeNextPath`, Google-only `signInWithOAuth`, callback code exchange, and middleware protection for `/gallery`, `/capture`, and `/api` routes. Do not expose service-role credentials.

- [ ] **Step 4: Run unit and build checks**

Run: `npm run test -- auth-redirect.test.ts && npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `git add app src middleware.ts tests && git commit -m "feat: add private Google auth flow"`

### Task 4: Implement URL validation and duplicate fingerprints

**Files:**
- Create: `src/lib/url.ts`, `src/server/gallery/contracts.ts`, `tests/unit/url.test.ts`
- Create: `src/features/images/types.ts`, `src/features/images/index.ts`

**Interfaces:**
- Produces `parseImageUrl(input: string): ValidatedImageUrl` and re-exports `ValidatedImageUrl` from `src/features/images/index.ts`.
- `ValidatedImageUrl` is `{ originalUrl: string; normalizedUrl: string; fingerprint: string }`.

- [ ] **Step 1: Write failing URL tests**

```ts
import { parseImageUrl } from '@/src/lib/url';

it('preserves the submitted URL but fingerprints a normalized host', () => {
  const value = parseImageUrl(' HTTPS://EXAMPLE.com:443/a.png?x=1 ');
  expect(value.originalUrl).toBe('HTTPS://EXAMPLE.com:443/a.png?x=1');
  expect(value.normalizedUrl).toBe('https://example.com/a.png?x=1');
});

it('rejects non-http URLs', () => {
  expect(() => parseImageUrl('file:///secret.png')).toThrow(/http/i);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test -- url.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the pure validator**

Use `URL`, accept only `http:` and `https:`, limit input length, normalize scheme/host/default ports, preserve path/query, and generate a SHA-256 hex fingerprint of the normalized value. Keep browser-independent parsing in `src/lib/url.ts`; put the image-owned public type in `src/features/images/types.ts` and export it only from the feature index.

- [ ] **Step 4: Run the test suite**

Run: `npm run test -- url.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `git add src tests && git commit -m "feat: validate and fingerprint image urls"`

### Task 5: Build image repositories and API routes

**Files:**
- Create: `src/server/gallery/image-repository.ts`, `src/features/images/service.ts`, `src/features/images/index.ts`, `app/api/images/route.ts`, `app/api/images/[id]/route.ts`, `tests/unit/image-repository.test.ts`

**Interfaces:**
- Consumes `ValidatedImageUrl`.
- Produces `createImage(ownerId, url): Promise<{ kind: 'created' | 'duplicate'; imageId: string }>` from the image feature service.
- Produces `listImages(ownerId, query): Promise<ImagePage>` and `setImageLoadStatus(ownerId, id, status)`.

- [ ] **Step 1: Write failing repository tests with a Supabase-query fake**

```ts
it('returns the existing image id when the fingerprint already exists', async () => {
  const result = await createImage(fakeRepository, 'owner-1', parsedUrl);
  expect(result).toEqual({ kind: 'duplicate', imageId: 'image-1' });
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm run test -- image-repository.test.ts`

Expected: FAIL because `createImage` does not exist.

- [ ] **Step 3: Implement repository and route behavior**

Keep all Supabase calls in `image-repository.ts`. Have `images/service.ts` own validation, duplicate response mapping, and the public image command functions. Route handlers authenticate, parse HTTP input, then call the image service; they do not query the database directly. Expose PATCH for `available`/`broken`, note update, Trash, restore, and permanent delete.

- [ ] **Step 4: Verify routes and tests**

Run: `npm run test -- image-repository.test.ts && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `git add app/api src/server tests && git commit -m "feat: add image capture and duplicate handling"`

### Task 6: Implement folder and tag services with batch-safe relationships

**Files:**
- Create: `src/lib/organization.ts`, `src/server/gallery/folder-repository.ts`, `src/server/gallery/tag-repository.ts`, `src/server/gallery/batch-repository.ts`, `src/features/folders/{types,service,index}.ts`, `src/features/tags/{types,service,index}.ts`, `app/api/folders/route.ts`, `app/api/tags/route.ts`, `app/api/images/batch/route.ts`, `tests/unit/organization.test.ts`, `supabase/tests/0002_organization.test.sql`

**Interfaces:**
- Produces `normalizeTagName(name): { displayName: string; normalizedName: string }`.
- Produces `validateFolderMove(tree, folderId, parentId): void`.
- Produces `applyBatchOperation(ownerId, input): Promise<BatchResult>` where `BatchResult` is `{ succeededIds: string[]; failed: Array<{ id: string; message: string }> }`.

- [ ] **Step 1: Write failing normalization and cycle tests**

```ts
expect(normalizeTagName('  INTERIOR  ')).toEqual({ displayName: 'INTERIOR', normalizedName: 'interior' });
expect(() => validateFolderMove(tree, 'root', 'child')).toThrow(/descendant/i);
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test -- organization.test.ts`

Expected: FAIL because organization helpers do not exist.

- [ ] **Step 3: Implement organization mutations**

Keep folder tree queries and mutations in `folder-repository.ts`, tag lookup/merge mutations in `tag-repository.ts`, and multi-image transactional operations in `batch-repository.ts`. Folder and tag feature services own normalization and validation, then expose typed commands through their `index.ts` files. Implement idempotent image-folder/image-tag links and batch add/remove/trash/restore with per-image results.

- [ ] **Step 4: Verify unit and database constraints**

Run: `npm run test -- organization.test.ts && supabase test db --file supabase/tests/0002_organization.test.sql`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `git add app/api src supabase tests && git commit -m "feat: add folder tag and batch operations"`

### Task 7: Add cursor search/filter queries and gallery state

**Files:**
- Create: `src/server/gallery/query-repository.ts`, `src/features/gallery/types.ts`, `src/features/gallery/use-gallery-state.ts`, `src/features/gallery/index.ts`, `tests/unit/gallery-query.test.ts`

**Interfaces:**
- Produces `GalleryFilters` with `search`, `folderId`, `tagIds`, `tagMode`, `inboxOnly`, `loadStatus`, `trashOnly`, and `view`.
- Produces `getImagePage(ownerId, filters, cursor): Promise<{ items: GalleryImage[]; nextCursor: string | null }>`.

- [ ] **Step 1: Write failing filter-construction tests**

```ts
expect(buildImageFilter({ inboxOnly: true })).toContain('no folder and no tag');
expect(buildImageFilter({ tagIds: ['a', 'b'], tagMode: 'all' })).toContain('both tags');
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test -- gallery-query.test.ts`

Expected: FAIL because `buildImageFilter` does not exist.

- [ ] **Step 3: Implement page queries and state reducer**

Use a 48-item keyset cursor ordered by `created_at, id`. Search notes, URL text, and normalized tag names; support Inbox, Trash, broken state, folder, and match-any/match-all tags. Keep filters, loaded pages, selection, and scroll restoration data in the gallery state hook. Export only the state hook and gallery contract from `features/gallery/index.ts`; components must not import query repository internals.

- [ ] **Step 4: Run query tests**

Run: `npm run test -- gallery-query.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `git add src tests && git commit -m "feat: add gallery filtering and cursor state"`

### Task 8: Build the responsive Viewer mode and direct image tiles

**Files:**
- Create: `app/(gallery)/gallery/page.tsx`, `components/ui/{icon-button,sheet}.tsx`, `components/gallery/gallery-shell.tsx`, `components/gallery/gallery-toolbar.tsx`, `components/gallery/filter-sheet.tsx`, `components/gallery/image-tile.tsx`, `components/gallery/masonry-gallery.tsx`, `components/gallery/square-gallery.tsx`, `components/gallery/broken-image.tsx`, `tests/unit/image-tile.test.tsx`

**Interfaces:**
- Consumes `GalleryFilters`, `GalleryImage`, and `useGalleryState()`.
- `ImageTile` emits `onOpen(id)`, `onToggleSelection(id)`, and `onLoadStatus(id, status)`.

- [ ] **Step 1: Write failing tile behavior tests**

```tsx
it('reports a broken source image', () => {
  const onLoadStatus = vi.fn();
  render(<ImageTile image={image} mode="viewer" onLoadStatus={onLoadStatus} />);
  fireEvent.error(screen.getByRole('img'));
  expect(onLoadStatus).toHaveBeenCalledWith(image.id, 'broken');
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test -- image-tile.test.tsx`

Expected: FAIL because `ImageTile` does not exist.

- [ ] **Step 3: Implement Viewer mode**

Build a responsive gallery shell by composing the public image, folder, tag, and gallery feature contracts. Keep generic icon-button and sheet behavior in `components/ui`; keep gallery tile and layout behavior in `components/gallery`. Render native `<img loading="lazy" decoding="async">`; use `content-visibility: auto` for masonry and TanStack Virtual for the square rows. Show broken badge/retry without hiding the image URL.

- [ ] **Step 4: Verify viewer rendering and responsive build**

Run: `npm run test -- image-tile.test.tsx && npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `git add app components src tests && git commit -m "feat: add responsive gallery viewer"`

### Task 9: Implement full-screen viewing and gesture restoration

**Files:**
- Create: `src/lib/gesture.ts`, `components/gallery/fullscreen-viewer.tsx`, `tests/unit/gesture.test.ts`, `tests/unit/fullscreen-viewer.test.tsx`

**Interfaces:**
- Produces `classifyGesture(deltaX, deltaY): 'dismiss' | 'previous' | 'next' | 'none'`.
- `FullscreenViewer` accepts `imageId`, ordered image IDs, `onDismiss()`, and `onNavigate(id)`.

- [ ] **Step 1: Write failing gesture tests**

```ts
expect(classifyGesture(12, 140)).toBe('dismiss');
expect(classifyGesture(-140, 15)).toBe('next');
expect(classifyGesture(20, 20)).toBe('none');
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test -- gesture.test.ts`

Expected: FAIL because `classifyGesture` does not exist.

- [ ] **Step 3: Implement full-screen interactions**

Use pointer events to distinguish a substantial downward swipe from horizontal navigation. Close button and downward dismiss call the same `onDismiss`; restore the saved Viewer mode filters, masonry/square choice, loaded pages, and `window.scrollY` before returning focus to the originating tile.

- [ ] **Step 4: Verify interaction tests**

Run: `npm run test -- gesture.test.ts fullscreen-viewer.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `git add components src tests && git commit -m "feat: add fullscreen viewer gestures"`

### Task 10: Build Management mode, batch sheets, and Trash

**Files:**
- Create: `components/gallery/management-gallery.tsx`, `components/gallery/batch-action-bar.tsx`, `components/gallery/folder-picker-sheet.tsx`, `components/gallery/tag-picker-sheet.tsx`, `components/gallery/trash-dialog.tsx`, `tests/unit/batch-action-bar.test.tsx`

**Interfaces:**
- Consumes `selectedIds: Set<string>` and `applyBatchOperation(input)`.
- Produces `onComplete(result: BatchResult)` and preserves selection on failed IDs.

- [ ] **Step 1: Write a failing batch-action-bar test**

```tsx
it('keeps failed ids selected after a batch mutation', async () => {
  render(<BatchActionBar selectedIds={new Set(['a', 'b'])} apply={failingApply} />);
  await userEvent.click(screen.getByRole('button', { name: /add tag/i }));
  expect(onSelectionChange).toHaveBeenCalledWith(new Set(['b']));
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm run test -- batch-action-bar.test.tsx`

Expected: FAIL because the batch action UI does not exist.

- [ ] **Step 3: Implement Management mode**

Make tile tap toggle selection only in Management mode. Add an always-visible mobile-safe bottom bar, nested multi-folder picker, tag auto-complete/create picker, remove operations, Trash confirmation, restore, and permanent-delete confirmation. Summarize success and failure counts after every operation.

- [ ] **Step 4: Run management tests**

Run: `npm run test -- batch-action-bar.test.tsx && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `git add components tests && git commit -m "feat: add touch batch management"`

### Task 11: Add URL paste and bookmarklet capture flow

**Files:**
- Create: `src/lib/bookmarklet.ts`, `src/features/capture/{types,service,index}.ts`, `components/gallery/add-url-dialog.tsx`, `app/capture/page.tsx`, `components/capture/capture-confirmation.tsx`, `tests/unit/bookmarklet.test.ts`, `tests/e2e/capture.spec.ts`

**Interfaces:**
- Produces `buildBookmarklet(appOrigin: string): string`.
- Bookmarklet opens `/capture?url=<encoded URL>` after direct-image detection or candidate selection.

- [ ] **Step 1: Write failing bookmarklet tests**

```ts
it('opens the capture route for a direct image document', () => {
  const script = buildBookmarklet('https://gallery.example');
  expect(script).toContain('document.contentType.startsWith("image/")');
  expect(script).toContain('https://gallery.example/capture?url=');
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm run test -- bookmarklet.test.ts`

Expected: FAIL because `buildBookmarklet` does not exist.

- [ ] **Step 3: Implement capture flows**

Keep page-scanning and bookmarklet string generation in `src/lib/bookmarklet.ts`. Let `features/capture/service.ts` map a selected URL to the public image-capture command. Build an ASCII bookmarklet that detects direct image documents or overlays visible, non-trivial `img`/`picture` candidates; a tap opens the authenticated confirmation route. The route only composes the capture feature and renders the selected image with save or duplicate-open feedback.

- [ ] **Step 4: Run unit and browser capture checks**

Run: `npm run test -- bookmarklet.test.ts && npx playwright test tests/e2e/capture.spec.ts`

Expected: PASS using a local fixture page with two selectable image elements.

- [ ] **Step 5: Commit**

Commit: `git add app components src tests && git commit -m "feat: add url and bookmarklet capture"`

### Task 12: Complete E2E coverage, deployment docs, and release verification

**Files:**
- Create: `tests/e2e/gallery.spec.ts`, `tests/e2e/management.spec.ts`, `tests/e2e/viewer.spec.ts`, `docs/deployment.md`
- Modify: `README.md`, `.env.example`

**Interfaces:**
- Produces a repeatable local test path and Vercel/Supabase deployment checklist.

- [ ] **Step 1: Write failing acceptance E2E scenarios**

Create scenarios for sign-in rejection, URL duplicate redirect, Inbox, combined tag match-any/all, multi-folder assignment, Trash/restore, broken image retry, phone selection, and downward viewer dismissal returning to the same masonry item.

- [ ] **Step 2: Run the suite to record current failures**

Run: `npx playwright test`

Expected: only scenarios requiring test auth data may fail until the local Supabase test environment and approved test account are configured.

- [ ] **Step 3: Add fixtures and complete scenario setup**

Use local static image fixtures only in tests, seed a local approved test user through Supabase test configuration, and make each test clean its owner-scoped data before execution.

- [ ] **Step 4: Run full verification**

Run: `npm run lint && npm run test && supabase test db && npx playwright test && npm run build`

Expected: all commands PASS.

- [ ] **Step 5: Document deployment and commit**

Document Supabase migration deploy, Google OAuth callback setup, hook activation, Vercel variables, Vercel deploy, and post-deploy allowlist verification. Commit: `git add tests docs README.md .env.example && git commit -m "test: verify link gallery workflows"`

## Plan Self-Review

- Spec coverage: Tasks 2-3 cover private Google auth, allowlist, and RLS; Tasks 4-7 cover URL-only storage, duplicates, folders, tags, Inbox, and search; Tasks 8-10 cover viewer, performance, touch batch management, Trash, and broken images; Task 9 covers full-screen swipe-down restoration; Task 11 covers both bookmarklet modes; Task 12 covers responsive E2E and deployment.
- Placeholder scan: no deferred implementation markers or unspecified error-handling steps are used.
- Type consistency: `ValidatedImageUrl`, `GalleryFilters`, `GalleryImage`, `BatchResult`, `createImage`, `applyBatchOperation`, and `classifyGesture` are introduced before use by later tasks.
