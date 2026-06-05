-- One-time userId remap after migrating from NextAuth (Auth0 sub) to Better Auth.
--
-- Context
-- -------
-- Before: every content row's `user_id` held the Auth0 `sub` (e.g. "auth0|abc").
-- After:  Better Auth generates its own `user.id` and stores the Auth0 sub in
--         `account.account_id` (provider_id = 'auth0'). `getSelfId()` now returns
--         the Better Auth `user.id`, so existing content rows must be remapped
--         from the old sub to the new user.id to stay visible / tenant-scoped.
--
-- Prerequisites (run IN ORDER, before this script)
-- ------------------------------------------------
--   1. `pnpm prisma:deploy` (creates user/session/account/verification tables).
--   2. Log in ONCE through Better Auth (Auth0) so the user + account rows exist.
--
-- How to run — CockroachDB Cloud Console (no psql needed)
-- ------------------------------------------------------
--   Cloud Console -> your cluster -> "SQL Shell" tab. Make sure the correct
--   database is selected (top of the shell, or run `USE <database>;` first —
--   the same database as DATABASE_URL). Paste the STEP 2 block below and run.
--   Then paste STEP 3 to verify (every row count must be 0).
--
-- How to run — psql (alternative)
-- -------------------------------
--   psql "$DATABASE_URL" -f packages/database/prisma/remap-userids-better-auth.sql
--
-- Notes
-- -----
-- * Pure SQL (no psql meta-commands), so it pastes into the Cloud Console as-is.
-- * The five UPDATEs are independent and idempotent (no BEGIN/COMMIT needed):
--   once a row's user_id is the new id it no longer matches any account_id, so
--   re-running is safe and is a no-op.
-- * Run as raw SQL only. Do NOT route through the Prisma client: the tenant
--   extension (app/src/prisma.ts) rewrites updateMany to force the active
--   tenant's user_id, which would defeat the remap. Raw SQL bypasses it.
-- * The join through `account` (account_id = old sub -> user_id = new id) means
--   you never have to hardcode any id.

-- ===========================================================================
-- STEP 1 (optional pre-check): inspect the Auth0 account mapping.
-- Expect exactly one row for a single-user app: old_sub -> new_user_id.
-- ===========================================================================
SELECT provider_id, account_id AS old_sub, user_id AS new_user_id
FROM account
WHERE provider_id = 'auth0';

-- ===========================================================================
-- STEP 2: remap content rows from the old Auth0 sub to the new Better Auth id.
-- ===========================================================================
UPDATE articles a
SET user_id = acc.user_id
FROM account acc
WHERE acc.provider_id = 'auth0' AND a.user_id = acc.account_id;

UPDATE notes n
SET user_id = acc.user_id
FROM account acc
WHERE acc.provider_id = 'auth0' AND n.user_id = acc.account_id;

UPDATE images i
SET user_id = acc.user_id
FROM account acc
WHERE acc.provider_id = 'auth0' AND i.user_id = acc.account_id;

UPDATE books b
SET user_id = acc.user_id
FROM account acc
WHERE acc.provider_id = 'auth0' AND b.user_id = acc.account_id;

UPDATE categories c
SET user_id = acc.user_id
FROM account acc
WHERE acc.provider_id = 'auth0' AND c.user_id = acc.account_id;

-- ===========================================================================
-- STEP 3 (verification): every count MUST be 0 after STEP 2 (no row left on the
-- old sub). If any count is > 0, re-run STEP 2.
-- ===========================================================================
SELECT 'articles' AS tbl, count(*) AS rows_still_on_old_sub
FROM articles a JOIN account acc ON acc.provider_id = 'auth0' AND a.user_id = acc.account_id
UNION ALL
SELECT 'notes', count(*)
FROM notes n JOIN account acc ON acc.provider_id = 'auth0' AND n.user_id = acc.account_id
UNION ALL
SELECT 'images', count(*)
FROM images i JOIN account acc ON acc.provider_id = 'auth0' AND i.user_id = acc.account_id
UNION ALL
SELECT 'books', count(*)
FROM books b JOIN account acc ON acc.provider_id = 'auth0' AND b.user_id = acc.account_id
UNION ALL
SELECT 'categories', count(*)
FROM categories c JOIN account acc ON acc.provider_id = 'auth0' AND c.user_id = acc.account_id;
