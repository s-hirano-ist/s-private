import { v7 } from "uuid";

/**
 * Generates a new UUIDv7 identifier.
 *
 * @remarks
 * UUIDv7 is a time-ordered UUID that provides both uniqueness and sortability.
 * The timestamp is embedded in the first 48 bits, making it suitable for
 * database primary keys where insertion order matters.
 *
 * @returns A new UUIDv7 string
 *
 * @example
 * ```typescript
 * const id = uuidv7();
 * // "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b"
 * ```
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9562#section-5.7 | RFC 9562 - UUIDv7}
 */
export const uuidv7 = (): string => v7();

/**
 * ID generator service for creating unique identifiers.
 *
 * @remarks
 * Provides a centralized service for generating identifiers.
 * Currently only supports UUIDv7.
 *
 * @example
 * ```typescript
 * import { idGenerator } from "@s-hirano-ist/s-core";
 *
 * const id = idGenerator.uuidv7();
 * ```
 */
export const idGenerator = { uuidv7 };
