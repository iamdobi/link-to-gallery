# Session And Mobile Toolbar Design

## Scope

Add a logout action and prevent gallery toolbar controls from overflowing on narrow mobile screens. Desktop and tablet toolbar behavior remains unchanged.

## Logout

- Add `POST /auth/sign-out`.
- The route creates the existing server Supabase client, calls `auth.signOut()`, and redirects to `/login`.
- Add a `Log out` icon button to the gallery toolbar. It calls the route and navigates after a successful response.
- If the request fails, the session stays intact and the toolbar exposes a short accessible error message.

## Responsive Toolbar

- At the existing small-screen breakpoint, render a compact first row with the gallery title and a menu button.
- Render the search field as a full-width second row.
- The menu opens a touch-friendly sheet containing image addition, filters, management mode, masonry or square-grid selection, and logout.
- At `sm` and wider, retain the current inline toolbar controls.
- The menu closes after an action is selected. The current view and mode remain visibly selected in the menu.

## Boundaries

- `GalleryToolbar` owns responsive presentation and menu state callbacks.
- `GalleryShell` continues to own gallery and management state, passing logout and toolbar actions as explicit callbacks.
- The sign-out route owns session mutation; client UI never accesses Supabase credentials directly.

## Error Handling And Tests

- The sign-out route redirects to login whether Supabase reports success or an already-expired session, so users never remain on a protected screen with a stale session.
- Unit tests cover route sign-out and redirect behavior, desktop logout affordance, and the mobile menu's action callbacks.
- Existing lint, unit tests, and production build remain required before deployment.
