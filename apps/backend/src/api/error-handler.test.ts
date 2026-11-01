import { apiErrorDefinitions } from "@s-hirano-ist/s-api-contracts/errors";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { HTTPException } from "hono/http-exception";
import { ApiError } from "s-private-backend/api/error";
import { apiErrorResponse } from "s-private-backend/api/error-handler";
import { expect, test, vi } from "vitest";

test("every public error derives its HTTP status from the contract", async () => {
	for (const entry of apiErrorDefinitions) {
		for (const code of entry.codes) {
			const report = vi.fn();
			const response = apiErrorResponse(new ApiError(code), report);
			expect(response.status).toBe(entry.status);
			expect(await response.json()).toEqual({ error: { code } });
			expect(report).toHaveBeenCalledTimes(Number(entry.status === 500));
		}
	}
});
test("malformed JSON is 422 while output validation and unexpected failures stay 500", async () => {
	const report = vi.fn();
	expect(apiErrorResponse(new HTTPException(400), report).status).toBe(422);
	const error = new Error("database secret");
	const response = apiErrorResponse(error, report);
	expect(response.status).toBe(500);
	expect(await response.text()).not.toContain("secret");
	expect(report).toHaveBeenCalledExactlyOnceWith(error);
});

test("application failures are translated only at the HTTP boundary", async () => {
	for (const [code, status, publicCode] of [
		["NOT_FOUND", 404, "NOT_FOUND"],
		["INVALID_SYNC_CURSOR", 422, "INVALID_SYNC_CURSOR"],
		["UNAVAILABLE", 503, "API_UNAVAILABLE"],
	] as const) {
		const error = new ApplicationError(code);
		expect(error).not.toHaveProperty("status");
		const response = apiErrorResponse(error, vi.fn());
		expect(response.status).toBe(status);
		expect(await response.json()).toEqual({ error: { code: publicCode } });
	}
});
