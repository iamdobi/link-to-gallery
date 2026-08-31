# Link Gallery Design

## Purpose

Link Gallery is a private, touch-friendly web gallery for image URLs found on the web. It stores only the original image URLs, then lets the owner browse, search, tag, and group them into nested folders without downloading or hosting any images.

The initial release is for one approved personal Google account, but the authorization model supports manually approving more accounts later.

## Chosen Platform

- **App:** Next.js with the App Router, deployed to Vercel Hobby.
- **Database and auth:** Supabase Postgres and Supabase Auth.
- **Sign-in:** Google OAuth only. Password, magic-link, anonymous, and other providers are disabled.
- **Image delivery:** The browser loads each external image URL directly. The app does not proxy, optimize, store, or create thumbnails for source images.

Vercel's public production URL can be visited, but only an explicitly approved Google email can create an auth user or read data. A Supabase Before User Created hook checks the email allowlist before `auth.users` insertion. RLS also scopes every application row to the signed-in owner.

## Maintainability and Module Boundaries

The app is organized by domain responsibility rather than by page size or a single shared utilities bucket.

- **Route layer:** App Router pages and route handlers compose feature modules, authenticate the request, and translate HTTP input/output. They do not contain SQL, URL normalization, gallery selection state, or gesture recognition.
- **Feature layer:** `images`, `folders`, `tags`, `gallery`, and `capture` each own their public types, client state, domain rules, and feature components. Another feature imports only the target feature's public `index.ts` exports, never its internal files.
- **Server layer:** Focused repositories encapsulate Supabase queries and mutations. Image, folder, tag, batch-operation, and gallery-query repositories have separate contracts, so a later UI or API can reuse them without duplicating rules.
- **Shared layer:** `src/lib` contains only framework-independent helpers such as URL fingerprints and gesture classification. Reusable visual primitives live in `components/ui`; gallery-specific components do not become generic components prematurely.
- **Database layer:** Each migration is additive and owns one coherent schema change. RLS policies and database functions remain close to the tables they protect. UI code never reaches tables through an untyped or service-role client.

Public contracts use explicit TypeScript input/output types and are covered by tests at the module boundary. Components receive data and callbacks rather than reading unrelated global state. A module should be split when it owns more than one of: persistence, domain transformation, interaction state, and visual presentation.

## Scope

### Included

- Private Google login with a manual email allowlist.
- Image URL creation through app paste and browser bookmarklet.
- Duplicate URL detection.
- Inbox for images without folders or tags.
- Nested folders and multiple folders per image.
- Tags, tag management, tag search, and tag auto-completion.
- Viewer and management modes.
- Masonry, square grid, and full-screen image views.
- Batch folder, tag, delete, and restore actions.
- Broken external image state and retry.
- Responsive phone, tablet, and desktop layouts.
- Cursor pagination, image lazy loading, and scalable list rendering.

### Deferred

- Copying image files into private object storage.
- Public or shared galleries.
- Automatic image captions, image search, and source-page archival.
- Collaborative permissions UI. New approved emails are initially managed in Supabase.

## Data Model

All application tables include `owner_id uuid not null references auth.users`, timestamps, and RLS policies requiring `owner_id = auth.uid()`.

### `allowed_emails`

- `email_normalized` is the unique, lower-cased email allowed to join.
- `approved_at` records approval time.
- The initial migration seeds the owner's personal Gmail.
- The Before User Created hook rejects an email that is not in this table, so unauthorized Google OAuth attempts do not leave an auth user record.

### `images`

- `id`
- `owner_id`
- `original_url`: exact submitted HTTP(S) URL, preserved for display and opening.
- `url_fingerprint`: deterministic SHA-256 based on a normalized comparison form of the URL; unique per owner among non-deleted images.
- `note`: optional owner-entered text for recognition and search.
- `load_status`: `unknown`, `available`, or `broken`.
- `last_load_checked_at`
- `deleted_at`: null for active images; non-null for trash.

The normalized comparison form removes incidental surrounding whitespace, lower-cases the scheme and hostname, removes a default port, and preserves path and query semantics. The exact submitted URL remains the canonical display/open value. The app rejects duplicate fingerprints before creating a new image.

### `folders`

- `id`, `owner_id`, `name`, `parent_id nullable`, `sort_order`.
- `parent_id` is constrained to folders owned by the same owner.
- A folder may contain child folders and image links.

### `image_folders`

- `image_id`, `folder_id`, with a unique pair.
- This explicit many-to-many relation permits one image in multiple folders.

### `tags` and `image_tags`

- A tag has `name`, `name_normalized`, and `owner_id`; `(owner_id, name_normalized)` is unique.
- `image_tags` links images and tags with a unique pair.
- Tag text is trimmed and case-folded for matching while retaining the chosen display name.

## Authentication and Security

1. The visitor opens the public Vercel URL and sees only a Google sign-in action.
2. Supabase completes Google identity verification.
3. Before creating a new auth user, the Supabase auth hook checks `allowed_emails`.
4. A non-approved email receives a generic access-denied response; no auth user, session, image, folder, or tag record is created.
5. Middleware redirects unauthenticated visitors away from gallery routes.
6. RLS enforces ownership on every client-visible database operation and relation.

With a personal Gmail account, an unknown visitor can initiate the Google OAuth screen from the public page. It cannot be fully prevented at the Google level, but the hook prevents account creation and data access. The app does not rely on hiding URLs as a security control.

## Image Capture

### App Paste

The owner pastes an HTTP(S) image URL into the add control. The server validates the scheme and URL length, derives the comparison fingerprint, checks for duplicates, and creates an Inbox image when unique.

### Bookmarklet

The bookmarklet opens the authenticated app on the gallery domain, so it never needs cross-origin database access from the page being captured.

- On a direct image document (`document.contentType` starts with `image/`), it opens the app's save-confirmation route with the current URL.
- On a normal document, it overlays selectable candidates from visible `<img>` and `<picture>` images. The owner taps one candidate, then the app opens its save-confirmation route with that selected image URL.
- The confirmation route reports an existing duplicate and offers to open it rather than creating a second item.

Candidates with an empty URL or insignificant rendered dimensions are ignored. Some sites may prevent a source image from loading later because of hotlink restrictions; the capture is still stored as the original URL, as requested.

## User Experience

### Viewer Mode

Viewer mode is the default and is optimized for browsing.

- Toolbar: search, folder/tag filtering, view selector, add URL, and a switch to Management mode.
- Inbox is a first-class filter for images with no folder and no tag.
- Layouts: masonry, square grid, and a full-screen single-image viewer.
- Desktop shows stable filter/navigation controls around a wide gallery. Phone and tablet controls use touch-sized targets and sheets for folders and tags.
- Selecting an image opens the full-screen viewer. It shows the image, original URL action, metadata, and previous/next navigation.
- The viewer has a close control and supports a deliberate downward swipe to dismiss. On dismiss it restores the exact preceding gallery state: active filters, chosen masonry/square layout, loaded cursor position, and scroll position. A horizontal swipe remains reserved for previous/next images, preventing gesture ambiguity.

### Management Mode

Management mode is explicitly entered from Viewer mode. It makes batch actions predictable rather than overloading normal image taps.

- Tapping image tiles toggles selection.
- A sticky bottom action bar exposes folder assignment, tag assignment, remove-from-folder/tag, move to trash, and clear selection.
- Folder selection uses a nested tree sheet and allows selecting several folders.
- Tag selection uses search, suggestions, and creation of a new normalized tag.
- All batch operations report selected, succeeded, and failed counts.

### Search and Organization

- Search matches optional notes, exact/partial tag names, and original URL text.
- Folder and tag filters can combine. Multiple tags use an explicit match-any/match-all choice rather than an implicit rule.
- Tag management supports rename, merge into another tag, and delete. A merge keeps every affected image association.
- Folder management supports create, rename, move within the tree, and delete. Deleting a folder requires a choice: move child folders to its parent or delete only the folder link while leaving child folders intact. Image records are never deleted by folder deletion.

### Trash and Broken Images

- Delete moves images to Trash and requires confirmation. Trash supports restore and permanent deletion.
- When an image element fires an error, the app marks the item `broken`, records the check time, and shows a broken badge plus a retry control.
- A successful retry marks it `available`. Network conditions and source-host anti-hotlink policies may cause a status to vary, so broken status is a helpful observation, not a guarantee that the original source no longer exists.

## Performance

- Gallery queries are keyset/cursor paginated with an initial and subsequent page size of 48.
- Images use `loading="lazy"`, async decoding, and an Intersection Observer fallback for browsers that need it.
- The square grid virtualizes long rows. Masonry uses bounded result pages and `content-visibility: auto` to avoid expensive off-screen painting.
- View state is retained while opening and dismissing a full-screen image, so a viewer round trip does not refetch or reset the masonry list.
- The app uses native image elements rather than Next Image optimization because arbitrary user-saved remote hosts are not known at build time and may reject optimized fetches.

## Errors and Feedback

- Invalid, unsupported, or duplicate URLs are rejected before insert with clear in-app feedback.
- Network and database failures preserve the current selection and allow retry.
- Unauthorized access displays a generic private-gallery response without revealing allowed emails.
- Batch operations are transactionally scoped where possible; partial failures list the affected images and do not hide successful changes.

## Verification Strategy

- Unit tests: URL normalization/fingerprints, tag normalization, folder tree validation, search filter construction, and gesture intent thresholds.
- Database integration tests: allowlist auth hook behavior, RLS isolation, duplicate constraints, cascading relation behavior, tag merge, and folder deletion options.
- Browser E2E tests: approved versus rejected sign-in, URL paste, bookmarklet confirmation route, duplicate flow, Inbox, combined tag search, multi-folder assignment, batch trash/restore, broken image retry, and viewer swipe-down restoration to masonry scroll position.
- Responsive E2E coverage targets a phone, tablet, and desktop viewport.

## Deployment and Configuration

- Vercel hosts the Next.js app at a public HTTPS URL.
- Supabase provides project URL, publishable key, Google OAuth configuration, database migrations, and the auth hook.
- Vercel environment variables hold only the values needed by the server and browser-safe Supabase client. Service-role credentials are server-only and are never bundled into bookmarklet code.
- Google OAuth redirect URLs include the local development URL and the Vercel production URL.

## Acceptance Criteria

1. Only a seeded allowed personal Gmail can create an account and access its data.
2. A unique original image URL can be saved, while a duplicate URL takes the owner to its existing record.
3. Images can remain in Inbox, receive multiple nested-folder memberships, and receive multiple tags.
4. Viewer mode provides masonry, square-grid, and full-screen layouts; a downward full-screen swipe returns to the same masonry location and state.
5. Management mode supports touch-friendly multi-select and batch folder, tag, trash, and restore operations.
6. Search and filters find images by tags, notes, URL text, folders, Inbox, and broken state.
7. Large galleries load incrementally and do not eagerly request every remote image.
8. Broken remote image URLs are visibly identified and can be retried.
