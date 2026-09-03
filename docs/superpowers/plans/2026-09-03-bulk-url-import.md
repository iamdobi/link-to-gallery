# Bulk URL Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one-per-line bulk URL import to the existing Add image URL sheet.

**Architecture:** Extend `AddUrlDialog` with a local input mode and result collection. Every nonblank line calls the existing `POST /api/images` endpoint sequentially, and `onSaved` executes once after at least one creation.

**Tech Stack:** Next.js App Router 16, React 19, TypeScript, Testing Library, Vitest.

## Global Constraints

- Store original URLs only and retain existing validation and duplicate behavior.
- Ignore blank lines; process remaining lines in entered order.
- Continue after an individual failed URL and render its outcome.

---

### Task 1: Bulk import dialog behavior

**Files:**
- Modify: `src/components/gallery/add-url-dialog.tsx`
- Create: `tests/unit/add-url-dialog.test.tsx`

**Interfaces:**
- `AddUrlDialog` continues consuming `{ open, onClose, onSaved }`.
- It renders one result row for every imported source URL and calls `onSaved()` only when a response has `kind: "created"`.

- [ ] Write a failing UI test for two URLs separated by a blank line: the test selects `Bulk add URLs`, enters the URLs, submits `Add 2 URLs`, then asserts one added result, one duplicate result, two sequential `POST /api/images` calls, and one `onSaved` call.
- [ ] Run `npm run test -- tests/unit/add-url-dialog.test.tsx`; expect it to fail because bulk mode does not exist.
- [ ] Add a two-button input mode selector, an `Image URLs` textarea, line normalization, sequential API requests, a count-aware submit button, and result rows.
- [ ] Run `npm run test -- tests/unit/add-url-dialog.test.tsx`; expect it to pass.
- [ ] Commit with `git commit -m "feat: add bulk image URL import"`.

### Task 2: Regression verification

**Files:**
- Modify only files required by verification fixes.

- [ ] Run `npm run lint`, `npm run test`, `npm run build`, and `npm run test:e2e`.
- [ ] Run `git diff origin/main...HEAD --check` and `git status --short --branch`.
