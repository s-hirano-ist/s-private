import { describe, expect, test, vi } from "vitest";
import { GET } from "./route";

// Mock NextResponse
vi.mock("next/server", () => ({
	NextResponse: {
		json: vi.fn((data) => ({
			json: async () => data,
			status: 200,
			headers: new Headers(),
		})),
	},
}));

describe("/api/health route", () => {
	test("should return status ok", async () => {
		const response = await GET();

		expect(response).toBeDefined();

		const { NextResponse } = await import("next/server");
		expect(NextResponse.json).toHaveBeenCalledWith({ status: "ok" });
	});

	test("should call NextResponse.json with correct data", async () => {
		const { NextResponse } = await import("next/server");

		await GET();

		expect(NextResponse.json).toHaveBeenCalledTimes(1);
		expect(NextResponse.json).toHaveBeenCalledWith({ status: "ok" });
	});

	test("should be an async function", () => {
		expect(GET).toBeInstanceOf(Function);
		expect(GET.constructor.name).toBe("AsyncFunction");
	});
});
