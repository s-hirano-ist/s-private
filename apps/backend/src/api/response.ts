import type { Context } from "hono";
import type { ApiEnvironment } from "s-private-backend/api/types";
import type { z, ZodType } from "zod";
/** Validate the public JSON DTO immediately before handing it to Hono. */
export function jsonResponse<S extends ZodType, Status extends 200 | 201>(
	c: Context<ApiEnvironment>,
	schema: S,
	value: unknown,
	status: Status,
) {
	return c.json<z.output<S>, Status>(schema.parse(value), status);
}
