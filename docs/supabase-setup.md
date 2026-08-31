# Supabase Setup

## Local development

Run `npx supabase start` from the repository root. The CLI requires the empty `supabase/snippets` directory to exist when using the current local container configuration.

Run database tests with:

```bash
npx supabase test db --local supabase/tests
```

## Hosted project

1. Create a Supabase project and run `npx supabase link --project-ref <project-ref>`.
2. Before enabling the auth hook, run the migration with `npx supabase db push`.
3. In the Supabase SQL editor, add the personal Google email that should be allowed:

```sql
insert into public.allowed_emails (email_normalized)
values (lower('owner@gmail.com'));
```

4. In Authentication Providers, enable Google and add the Google OAuth client ID and secret. Leave email, password, anonymous, and other providers disabled.
5. In Authentication Hooks, select `public.before_user_created_allowlist` as the Before User Created hook.
6. Add `http://localhost:3000/auth/callback` and the Vercel production callback URL to the Google OAuth redirect URLs.
