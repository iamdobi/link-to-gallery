# Deployment

## Supabase

1. Create a Supabase project, then link this repository with `npx supabase link --project-ref <project-ref>`.
2. Apply the checked-in schema with `npx supabase db push`.
3. Add the only Google account allowed to create an Auth user:

```sql
insert into public.allowed_emails (email_normalized)
values (lower('your-personal-gmail@gmail.com'));
```

4. In Authentication, enable only Google. Leave email/password, anonymous sign-in, and other social providers disabled.
5. In Authentication Hooks, enable `public.before_user_created_allowlist` as the Before User Created hook. The hook denies a non-allowlisted address before its Auth user row is created.
6. In Google Cloud, create a Web application OAuth client. Add `https://<project-ref>.supabase.co/auth/v1/callback` as its authorized redirect URI, then put the client ID and secret in the Supabase Google provider settings.
7. In Supabase Authentication URL Configuration, set Site URL to the production app URL and add these redirect URLs:

```text
http://localhost:3000/auth/callback
https://your-domain.example/auth/callback
```

The browser asks Supabase to return to the app callback route. That callback exchanges the authorization code, then redirects to the requested local gallery route.

## Vercel

1. Import the repository into Vercel.
2. Add these Production and Preview environment variables from Supabase Project Settings > API:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
```

3. Do not add `SUPABASE_SERVICE_ROLE_KEY` or `E2E_SUPABASE_SERVICE_ROLE_KEY` to Vercel. This application does not need a service-role key at runtime.
4. Deploy with the Vercel dashboard or `npx vercel --prod`.
5. Add the resulting production URL to Supabase Redirect URLs. Add each preview URL only when it must support OAuth testing.

## Verification

1. In a private browser window, try a non-allowlisted Google account. The hook must deny it before a new account appears in Supabase Auth users.
2. Sign in with the approved personal Gmail account and confirm that `/gallery` opens.
3. Paste an image URL, verify it appears in Inbox, add it to multiple folders and tags, and confirm a duplicate reports as already saved.
4. Open the image viewer and swipe down. It should return to the previous masonry position.
5. In the gallery's Add image URL sheet, copy the bookmarklet code into a browser bookmark, then test both a direct image URL and a normal page with multiple images.

## Authenticated E2E

`npm run test:e2e` always runs the isolated bookmarklet capture test. To run the authenticated gallery scenarios, use a disposable, allowlisted Google test account and set the following local-only variables:

```text
E2E_APP_URL=http://localhost:3000
E2E_SUPABASE_URL=http://127.0.0.1:54321
E2E_SUPABASE_SERVICE_ROLE_KEY=<local service role key>
E2E_OWNER_ID=<test account auth.users id>
E2E_STORAGE_STATE=.auth/e2e-owner.json
E2E_ALLOW_DATA_RESET=true
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` before starting the app. Export the E2E variables above in the shell, then let Playwright start the local app:

```bash
E2E_START_SERVER=true npm run test:e2e
```

Create the storage-state file by signing into the running local app once with that account, then save the authenticated browser storage state to the configured path. Each authenticated test deletes and recreates only that owner's gallery rows and runs serially; use an account dedicated to tests. The data-reset guard accepts only `http://localhost` or `http://127.0.0.1` Supabase URLs and requires `E2E_ALLOW_DATA_RESET=true`. Without these variables, those scenarios are intentionally skipped rather than using a production personal account.

## References

- [Supabase Before User Created hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook)
- [Supabase redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Google login](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
