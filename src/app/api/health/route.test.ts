import { describe, expect, it, vi } from "vitest";
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
	it("should return status ok", async () => {
		const response = await GET();

		expect(response).toBeDefined();

		const { NextResponse } = await import("next/server");
		expect(NextResponse.json).toHaveBeenCalledWith({ status: "ok" });
	});

	it("should call NextResponse.json with correct data", async () => {
		const { NextResponse } = await import("next/server");

		await GET();

		expect(NextResponse.json).toHaveBeenCalledTimes(1);
		expect(NextResponse.json).toHaveBeenCalledWith({ status: "ok" });
	});

	it("should be an async function", () => {
		expect(GET).toBeInstanceOf(Function);
		expect(GET.constructor.name).toBe("AsyncFunction");
	});

	it("should have edge runtime export", async () => {
		const module = await import("./route");
		expect(module.runtime).toBe("edge");
	});
});
