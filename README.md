# Poultry Platform

Neutral internal application foundation built with Next.js App Router, TypeScript,
Tailwind CSS, Prisma/MySQL, Auth.js, Zod, and a layered `src/` structure.

## Local setup

1. Copy `.env.example` to `.env` and replace every placeholder required locally.
2. Create the MySQL database named in `DATABASE_URL`.
3. Run `npm install`.
4. Run `npm run db:generate` and `npm run db:deploy`.
5. Verify connectivity with `npm run db:check`.
6. Start the app with `npm run dev`.

`GET /api/health` performs a minimal database probe and only returns `ok` or
`degraded` status data. It never returns connection strings or exception details.

The database uses one `User` table with normalized `Role` and `UserRole` records,
so a user can hold several roles without separate seller, mentor, worker, or
employer user tables. Run `npm run db:seed` after migration to create the five
standard roles and the first admin configured in `.env`.

Credentials authentication includes registration, email verification, login,
logout, password recovery, database-backed rate limits, and JWT session
revocation. New registrations start as `PENDING` with no roles and become
`ACTIVE` only after email verification. Suspended and soft-deleted accounts are
rejected at sign-in and re-checked during subsequent session use.

Platform rules and company identity are stored in the `Setting` table and can be
updated from `/admin/settings` without a redeploy. Server code reads company
identity through `BrandingService`; admin-authored content can use `{company}` and
`{company_short}` placeholders.

Brand media is served from local persistent storage. Set `STORAGE_ROOT` to a
mounted, durable directory in production; the default `storage/uploads` path is
intended for a single local application instance. Payment and mail secrets remain
environment variables and are never stored through the settings page.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
```

Playwright browser binaries may need to be installed once with
`npx playwright install chromium`.

## Structure

- `src/app` — pages and route handlers
- `src/components` — shared UI
- `src/server/services` — application services
- `src/server/validation` — Zod schemas
- `src/server/database` — Prisma and MySQL helpers
- `src/server/authentication` — authentication configuration
- `src/server/authorization` — access-control helpers
- `src/server/emails`, `jobs`, `storage` — infrastructure boundaries
- `src/tests` — unit, component, and end-to-end tests
