# Bulk URL Import Design

## Goal

Let a gallery owner add multiple original image URLs in one operation while preserving the existing per-URL validation, duplicate detection, and Inbox behavior.

## User Experience

- The Add image URL sheet provides a single/bulk mode control.
- Bulk mode accepts one URL per line. Blank lines are ignored.
- Saving processes supplied URLs sequentially through the existing image endpoint.
- The sheet displays a concise summary and a per-URL result list for created, duplicate, and failed entries.
- A completed import reloads the gallery and counts once, only when at least one image was created.

## Architecture

The client component normalizes textarea lines and uses the existing authenticated `POST /api/images` contract for each URL. This intentionally keeps URL validation, ownership, and duplicate behavior in `saveCapture`; no bulk server route or schema change is required.

## Error Handling and Tests

- A failed URL does not interrupt later URLs.
- Result rows retain the original source string and server-provided message.
- Unit coverage verifies blank-line removal, sequential requests, and mixed created/duplicate/error reporting.
- Existing single URL behavior remains unchanged.
