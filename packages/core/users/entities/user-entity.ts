import { z } from "zod";

/**
 * Zod schema for validating user roles.
 *
 * @remarks
 * Roles are the authorization source of truth, stored in the database
 * (`User.roles`). Auth0 only provides authentication (identity).
 * - `VIEWER`: read / admin operations (e.g. export confirmation)
 * - `DUMPER`: content creation / deletion
 *
 * @example
 * ```typescript
 * const role = Role.parse("VIEWER");
 * ```
 *
 * @see {@link makeRole} for factory function
 */
export const Role = z.enum(["VIEWER", "DUMPER"]).brand<"Role">();

/**
 * Branded type for validated user roles.
 *
 * @remarks
 * This type is branded to prevent accidental assignment of raw strings.
 * Always use {@link makeRole} to create instances.
 */
export type Role = z.infer<typeof Role>;

/**
 * Creates a validated Role from a string.
 *
 * @param v - The role string (typically from the database)
 * @returns A branded Role value
 * @throws {ZodError} When the string is not a known role
 *
 * @example
 * ```typescript
 * const role = makeRole("DUMPER");
 * ```
 */
export const makeRole = (v: string): Role => Role.parse(v);
