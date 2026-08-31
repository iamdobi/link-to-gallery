# Link Gallery

Private web gallery for organizing external image URLs. Images are loaded directly from their original URLs and are never copied into this application.

Deployment, private Google access, and E2E setup are documented in [docs/deployment.md](docs/deployment.md).

## Development

1. Copy `.env.example` to `.env.local` and set the public Supabase values.
2. Follow [docs/supabase-setup.md](docs/supabase-setup.md) to start or connect Supabase.
3. Run `npm install` and `npm run dev`.

## Checks

Run `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build` before deployment. The capture browser test runs without a database; authenticated acceptance tests require the E2E variables in `.env.example`.
