-- Convert users.roles from the (mistaken) "Role"[] enum array to STRING[].
-- The Role enum was only ever applied to the dev DB; the schema now uses
-- String[] because CockroachDB + @prisma/adapter-pg cannot write enum arrays.
-- Role values are validated at the domain boundary by the Zod schema in
-- packages/core/users/entities/user-entity.ts.
-- NOTE: roles data is dropped here (re-seed via `set-user-roles`); an in-place
-- enum[] -> string[] cast is not cleanly supported on CockroachDB.

-- AlterTable
ALTER TABLE "users" DROP COLUMN "roles";
ALTER TABLE "users" ADD COLUMN     "roles" STRING[];

-- DropEnum (IF EXISTS: the type is absent on fresh DBs where migration 1 already creates STRING[])
DROP TYPE IF EXISTS "Role";
