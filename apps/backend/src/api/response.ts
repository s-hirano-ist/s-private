import type { z, ZodType } from "zod";
/** Validate the public JSON DTO immediately before handing it to Hono. */
export function responseBody<S extends ZodType>(
	schema: S,
	value: unknown,
): z.output<S> {
	return schema.parse(value);
}
