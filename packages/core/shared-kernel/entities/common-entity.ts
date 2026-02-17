import { z } from "zod";
import { idGenerator } from "../services/id-generator.js";

/**
 * Zod schema for validating UUIDv7 identifiers.
 *
 * @remarks
 * UUIDv7 is time-ordered, making it suitable for database primary keys.
 * Auto-generates a new UUIDv7 if no value is provided.
 *
 * @example
 * ```typescript
 * const id = Id.parse(undefined); // Auto-generates UUIDv7
 * const id2 = Id.parse("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b");
 * ```
 *
 * @see {@link makeId} for factory function
 */
export const Id = z
	.uuid({ version: "v7" })
	.default(() => idGenerator.uuidv7())
	.brand<"Id">();
/**
 * Branded type for validated UUIDv7 identifiers.
 *
 * @remarks
 * This type is branded to prevent accidental assignment of raw strings.
 * Always use {@link makeId} to create instances.
 */
export type Id = z.infer<typeof Id>;

/**
 * Creates a validated Id from an optional string.
 *
 * @param id - Optional UUIDv7 string. If not provided, generates a new one.
 * @returns A branded Id value
 * @throws {ZodError} When the provided string is not a valid UUIDv7
 *
 * @example
 * ```typescript
 * const newId = makeId(); // Auto-generate
 * const existingId = makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b");
 * ```
 */
export const makeId = (id?: string): Id => {
	if (!id) return Id.parse(idGenerator.uuidv7());
	return Id.parse(id);
};

/**
 * Zod schema for validating user identifiers.
 *
 * @remarks
 * Validates that the user ID is a non-empty string.
 * Used for multi-tenant data isolation across all domains.
 *
 * @example
 * ```typescript
 * const userId = UserId.parse("auth0|123456789");
 * ```
 *
 * @see {@link makeUserId} for factory function
 */
export const UserId = z.string().min(1, "required").brand<"UserId">();

/**
 * Branded type for validated user identifiers.
 *
 * @remarks
 * This type is branded to prevent accidental assignment of raw strings.
 * All domain entities include userId for tenant isolation.
 */
export type UserId = z.infer<typeof UserId>;

/**
 * Creates a validated UserId from a string.
 *
 * @param v - The user ID string (typically from Auth0)
 * @returns A branded UserId value
 * @throws {ZodError} When the string is empty
 *
 * @example
 * ```typescript
 * const userId = makeUserId("auth0|123456789");
 * ```
 */
export const makeUserId = (v: string): UserId => UserId.parse(v);

/**
 * Zod schema for validating creation timestamps.
 *
 * @remarks
 * Validates that the value is a valid Date object.
 * Used to track when entities are created.
 *
 * @example
 * ```typescript
 * const timestamp = CreatedAt.parse(new Date());
 * ```
 *
 * @see {@link makeCreatedAt} for factory function
 */
export const CreatedAt = z.date().brand<"CreatedAt">();

/**
 * Branded type for validated creation timestamps.
 */
export type CreatedAt = z.infer<typeof CreatedAt>;

/**
 * Creates a validated CreatedAt timestamp.
 *
 * @param createdAt - Optional Date. If not provided, uses current time.
 * @returns A branded CreatedAt value
 * @throws {ZodError} When the value is not a valid Date
 *
 * @example
 * ```typescript
 * const now = makeCreatedAt(); // Current time
 * const specific = makeCreatedAt(new Date("2024-01-01"));
 * ```
 */
export const makeCreatedAt = (createdAt?: Date): CreatedAt => {
	if (!createdAt) return CreatedAt.parse(new Date());
	return CreatedAt.parse(createdAt);
};

/**
 * Zod schema for validating update timestamps.
 *
 * @remarks
 * Validates that the value is a valid Date object.
 * Used to track when entities are last modified.
 *
 * @example
 * ```typescript
 * const timestamp = UpdatedAt.parse(new Date());
 * ```
 *
 * @see {@link makeUpdatedAt} for factory function
 */
export const UpdatedAt = z.date().brand<"UpdatedAt">();

/**
 * Branded type for validated update timestamps.
 */
export type UpdatedAt = z.infer<typeof UpdatedAt>;

/**
 * Creates a validated UpdatedAt timestamp.
 *
 * @param updatedAt - Optional Date. If not provided, uses current time.
 * @returns A branded UpdatedAt value
 * @throws {ZodError} When the value is not a valid Date
 *
 * @example
 * ```typescript
 * const now = makeUpdatedAt(); // Current time
 * const specific = makeUpdatedAt(new Date("2024-01-01"));
 * ```
 */
export const makeUpdatedAt = (updatedAt?: Date): UpdatedAt => {
	if (!updatedAt) return UpdatedAt.parse(new Date());
	return UpdatedAt.parse(updatedAt);
};

/**
 * Zod schema for the UNEXPORTED status literal.
 *
 * @remarks
 * Represents the initial state of all content entities.
 * Content transitions from UNEXPORTED to EXPORTED when published.
 *
 * @see {@link ExportedStatus} for the exported state
 * @see {@link Status} for the union type
 */
export const UnexportedStatus = z.literal("UNEXPORTED");

/**
 * Literal type for the UNEXPORTED status.
 */
export type UnexportedStatus = z.infer<typeof UnexportedStatus>;

/**
 * Creates an UnexportedStatus value.
 *
 * @returns The literal "UNEXPORTED" status
 *
 * @example
 * ```typescript
 * const status = makeUnexportedStatus(); // "UNEXPORTED"
 * ```
 */
export const makeUnexportedStatus = (): UnexportedStatus =>
	UnexportedStatus.parse("UNEXPORTED");

/**
 * Zod schema for the LAST_UPDATED status literal.
 *
 * @remarks
 * Represents the intermediate state of content entities during batch processing.
 * Content transitions from UNEXPORTED to LAST_UPDATED when marked for export,
 * then from LAST_UPDATED to EXPORTED when finalized.
 * Can be reverted back to UNEXPORTED if something goes wrong.
 *
 * @see {@link UnexportedStatus} for the initial state
 * @see {@link ExportedStatus} for the final state
 * @see {@link Status} for the union type
 */
export const LastUpdatedStatus = z.literal("LAST_UPDATED");

/**
 * Literal type for the LAST_UPDATED status.
 */
export type LastUpdatedStatus = z.infer<typeof LastUpdatedStatus>;

/**
 * Zod schema for validating export timestamps.
 *
 * @remarks
 * Validates that the value is a valid Date object.
 * Used to track when entities are exported/published.
 *
 * @example
 * ```typescript
 * const timestamp = ExportedAt.parse(new Date());
 * ```
 *
 * @see {@link makeExportedAt} for factory function
 */
export const ExportedAt = z.date().brand<"ExportedAt">();

/**
 * Branded type for validated export timestamps.
 */
export type ExportedAt = z.infer<typeof ExportedAt>;

/**
 * Creates a validated ExportedAt timestamp.
 *
 * @param exportedAt - Optional Date. If not provided, uses current time.
 * @returns A branded ExportedAt value
 * @throws {ZodError} When the value is not a valid Date
 *
 * @example
 * ```typescript
 * const now = makeExportedAt(); // Current time
 * const specific = makeExportedAt(new Date("2024-01-01"));
 * ```
 */
export const makeExportedAt = (exportedAt?: Date): ExportedAt => {
	if (!exportedAt) return ExportedAt.parse(new Date());
	return ExportedAt.parse(exportedAt);
};

/**
 * Zod schema for the EXPORTED status with timestamp.
 *
 * @remarks
 * Represents the published state of content entities.
 * Includes both the status literal and the export timestamp.
 *
 * @example
 * ```typescript
 * const exported = ExportedStatus.parse({
 *   status: "EXPORTED",
 *   exportedAt: new Date()
 * });
 * ```
 *
 * @see {@link UnexportedStatus} for the initial state
 * @see {@link makeExportedStatus} for factory function
 */
export const ExportedStatus = z.object({
	status: z.literal("EXPORTED"),
	exportedAt: ExportedAt,
});

/**
 * Type for the EXPORTED status with timestamp.
 */
export type ExportedStatus = z.infer<typeof ExportedStatus>;

/**
 * Creates an ExportedStatus with current timestamp.
 *
 * @returns An ExportedStatus object with status "EXPORTED" and current time
 *
 * @example
 * ```typescript
 * const status = makeExportedStatus();
 * // { status: "EXPORTED", exportedAt: Date }
 * ```
 */
export const makeExportedStatus = (): ExportedStatus =>
	ExportedStatus.parse({ status: "EXPORTED", exportedAt: new Date() });

/**
 * Union type for entity status.
 *
 * @remarks
 * Represents the lifecycle state of content entities.
 * State transitions: UNEXPORTED → LAST_UPDATED → EXPORTED
 * LAST_UPDATED can be reverted back to UNEXPORTED.
 *
 * @example
 * ```typescript
 * function filterByStatus(items: Entity[], status: Status) {
 *   return items.filter(item => item.status === status);
 * }
 * ```
 */
export type Status =
	| UnexportedStatus
	| LastUpdatedStatus
	| ExportedStatus["status"];
