import type { OpenAPIHono } from "@hono/zod-openapi";
import type { sessionSchema } from "@s-hirano-ist/s-api-contracts/schemas";
import type { BlankSchema } from "hono/types";
import type { z } from "zod";
export type ApiSession = z.output<typeof sessionSchema>;
export type ApiAuth = {
	authenticateBearer(request: Request): Promise<string>;
	getWebSession(
		headers: Headers,
	): Promise<{ headers?: Headers; session: ApiSession | null }>;
	isTrustedOrigin(origin: string): boolean;
	reportError(error: unknown): void;
};
export type ApiEnvironment = {
	Variables: { owner: string; session: ApiSession | null };
};

export type ApiApp = OpenAPIHono<ApiEnvironment, BlankSchema, "/api/v1">;
