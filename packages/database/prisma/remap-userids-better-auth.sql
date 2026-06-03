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
-- How to run
-- ----------
-- 1. Deploy the schema migration (creates user/session/account/verification):
--      pnpm prisma:deploy
-- 2. Log in ONCE through Better Auth (Auth0) so the user + account rows exist.
-- 3. Run this script against the SAME database (psql / CockroachDB SQL shell):
--      psql "$DATABASE_URL" -f packages/database/prisma/remap-userids-better-auth.sql
--
-- This is intentionally raw SQL, NOT a Prisma migration and NOT routed through
-- the Prisma client: the tenant extension (app/src/prisma.ts) rewrites
-- updateMany to force the active tenant's user_id, which would defeat the remap.
-- Raw SQL bypasses the extension entirely.
--
-- The join through `account` (account_id = old sub  ->  user_id = new id) means
-- you never have to hardcode the ids. Safe to re-run: once a row's user_id is the
-- new id it no longer matches any account_id, so it is left untouched.

BEGIN;

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

COMMIT;
