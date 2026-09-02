# Inbox Triage and Counts Design

## Goal

Make unorganized image links easy to process one at a time and make the current gallery size visible without changing the rule that an Inbox image has neither folders nor tags.

## User Experience

- The gallery toolbar shows the total active-image count and the Inbox count.
- A new **Organize Inbox** command is available in the desktop toolbar and mobile menu.
- It opens a touch-first triage view that loads only Inbox images. The view shows one image, its position in the current Inbox, a close control, a skip control, and large controls for folders and tags.
- Selecting one or more folders or tags and confirming applies that association to the current image. On success the image immediately advances to the next Inbox image. The image is therefore no longer eligible for Inbox because it now has a folder or tag.
- Skip advances without changing the image. Empty Inbox states clearly indicate completion.
- If an operation fails, the current image stays visible and the error is announced. The user can retry or close the triage view.

## Architecture

`getGalleryCounts` in the gallery query repository returns exact active and Inbox counts for an authenticated owner. The gallery page loads these counts with the initial page, folders, and tags. `GalleryShell` owns current count state and refreshes it after every image mutation.

`InboxTriage` is a focused client component. It requests Inbox pages through the existing `/api/images?inboxOnly=true` endpoint, keeps a small cursor-backed queue, and delegates folder/tag selection to the existing picker sheets. It invokes the existing batch endpoint with a single image ID, so ownership validation and association rules remain centralized in the batch repository.

## Data Flow

1. The server page retrieves the initial gallery page and `GalleryCounts`.
2. The toolbar renders `active` and `inbox` counts from `GalleryShell` state.
3. Opening triage fetches its own Inbox page and cursor, independently of the visible gallery filters.
4. A successful folder/tag batch operation removes the current item from triage, refills the queue as needed, refreshes counts, and reloads the visible gallery page.
5. Failed operations leave the queue and visible gallery unchanged.

## Testing

- Unit-test count queries' active and Inbox filtering behavior through the query repository's exported count helper contract.
- Unit-test the toolbar exposes the supplied total and Inbox counts and invokes the triage command from the mobile menu.
- Unit-test triage queue advancement: a successful assignment moves to the next image, while a failure retains the current image.
- Run lint, the full unit suite, production build, and the relevant authenticated Playwright checks.

## Scope

This feature does not add a second Inbox state, new database tables, image uploads, or changes to folder/tag schema. Counts are exact for active (non-trash) images and Inbox images; trash counts are intentionally out of scope.
