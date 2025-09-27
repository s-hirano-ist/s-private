import { describe, expect, test } from "vitest";
import { GET } from "./route";

describe("/api/health route", () => {
	test("should return status ok", async () => {
		const response = await GET();

		expect(response).toBeDefined();

		const { NextResponse } = await import("next/server");
		expect(NextResponse.json).toHaveBeenCalledTimes(1);
		expect(NextResponse.json).toHaveBeenCalledWith({ status: "ok" });
	});
});
