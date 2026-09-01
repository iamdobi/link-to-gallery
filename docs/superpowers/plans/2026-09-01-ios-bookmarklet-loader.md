# iOS Bookmarklet Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the bookmarklet copied on iOS compact enough for mobile browser bookmark handling while preserving the existing image-picker behavior.

**Architecture:** Keep the full picker in a reusable runner string served by a same-origin JavaScript route. The iOS installer copies a short `javascript:` loader that adds that script to the current page; desktop browsers retain the inline bookmarklet so existing pages with restrictive script policies keep their current behavior.

**Tech Stack:** Next.js App Router, TypeScript, React, Vitest, Playwright.

## Global Constraints

- Store only image URLs; no image bytes are introduced.
- Do not retry or alter capture persistence behavior.
- Use an external loader only on iOS and retain the current inline bookmarklet for desktop.
- A web page cannot add a browser bookmark programmatically; do not present the loader as an automatic installation flow.

---

### Task 1: Extract the bookmarklet runner and serve it from the app

**Files:**
- Modify: `src/lib/bookmarklet.ts`
- Create: `src/app/bookmarklet.js/route.ts`
- Modify: `tests/unit/bookmarklet.test.ts`
- Modify: `tests/e2e/capture.spec.ts`

**Interfaces:**
- Produces: `buildBookmarkletRunner(appOrigin: string): string`, the full picker program.
- Produces: `buildCompactBookmarklet(appOrigin: string): string`, a short `javascript:` loader.
- Produces: `GET /bookmarklet.js`, JavaScript with `Content-Type: application/javascript`.

- [ ] **Step 1: Write failing bookmarklet tests**

```ts
it("builds a compact loader for mobile browsers", () => {
  const script = buildCompactBookmarklet("https://gallery.example");
  expect(script).toContain("https://gallery.example/bookmarklet.js");
  expect(script.length).toBeLessThan(400);
});

it("keeps the image picker in the reusable runner", () => {
  expect(buildBookmarkletRunner("https://gallery.example")).toContain("document.images");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test -- tests/unit/bookmarklet.test.ts`

Expected: FAIL because the compact loader and runner exports do not exist.

- [ ] **Step 3: Extract the full picker and add the route**

```ts
export function buildBookmarkletRunner(appOrigin: string): string {
  return `(()=>{/* current image picker */})()`;
}

export function buildCompactBookmarklet(appOrigin: string): string {
  const src = JSON.stringify(`${trimTrailingSlash(appOrigin)}/bookmarklet.js`);
  return `javascript:(()=>{const s=document.createElement("script");s.src=${src};document.head.append(s)})()`;
}
```

```ts
export function GET(request: NextRequest) {
  return new NextResponse(buildBookmarkletRunner(request.nextUrl.origin), {
    headers: { "Content-Type": "application/javascript; charset=utf-8" },
  });
}
```

- [ ] **Step 4: Run focused unit and capture tests**

Run: `npm run test -- tests/unit/bookmarklet.test.ts && npx playwright test tests/e2e/capture.spec.ts`

Expected: PASS; the existing picker test evaluates the runner directly.

### Task 2: Select the compact loader for iOS installation

**Files:**
- Modify: `src/components/gallery/bookmarklet-install.tsx`
- Modify: `tests/unit/bookmarklet-install.test.tsx`

**Interfaces:**
- Consumes: `buildBookmarklet`, `buildCompactBookmarklet`.
- Produces: `getBookmarkletForBrowser(appOrigin: string, userAgent: string, maxTouchPoints?: number): string` and iOS-specific compact code in the existing read-only installer field.

- [ ] **Step 1: Write a failing installer test**

```tsx
it("selects the compact loader for an iPhone browser", () => {
  const bookmarklet = getBookmarkletForBrowser(
    "https://gallery.example",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
  );

  expect(bookmarklet).toContain("/bookmarklet.js");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test -- tests/unit/bookmarklet-install.test.tsx`

Expected: FAIL because the installer does not expose browser-specific bookmarklet selection.

- [ ] **Step 3: Add a small iOS selection helper and use it in the installer**

```ts
export function isIOS(userAgent: string, maxTouchPoints = 0): boolean {
  return /iPad|iPhone|iPod/.test(userAgent) || (userAgent.includes("Macintosh") && maxTouchPoints > 1);
}
```

Use the helper from `getBookmarkletForBrowser` to choose `buildCompactBookmarklet` only on iPhone/iPad. Keep the existing inline `buildBookmarklet` elsewhere.

- [ ] **Step 4: Run the focused installer test**

Run: `npm run test -- tests/unit/bookmarklet-install.test.tsx`

Expected: PASS with the iPhone assertion and the existing clipboard fallback assertion.

### Task 3: Verify and deploy

**Files:**
- No additional production files.

- [ ] **Step 1: Run quality checks**

Run: `npm run lint && npm run test && npm run build`

Expected: all commands exit with code 0.

- [ ] **Step 2: Inspect the final diff**

Run: `git diff --check && git diff --stat`

Expected: only the loader, route, installer, and their focused tests change.

- [ ] **Step 3: Commit and push**

```bash
git add src/lib/bookmarklet.ts src/app/bookmarklet.js/route.ts src/components/gallery/bookmarklet-install.tsx tests/unit/bookmarklet.test.ts tests/unit/bookmarklet-install.test.tsx tests/e2e/capture.spec.ts docs/superpowers/plans/2026-09-01-ios-bookmarklet-loader.md
git commit -m "fix: use compact bookmarklet loader on iOS"
git push origin main
```
