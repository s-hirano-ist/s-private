import { getLoginUserInfo } from "@/features/auth/utils/header-info";
import { headers } from "next/headers";
import { type Mock, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
	headers: vi.fn(),
}));

describe("getLoginUserInfo", () => {
	it("should return the correct IP address and user agent", async () => {
		(headers as Mock).mockReturnValue({
			get: (key: string) => {
				if (key === "x-forwarded-for") return "192.168.1.1, 10.0.0.1";
				if (key === "user-agent") return "Mozilla/5.0";
				return null;
			},
		});

		const result = await getLoginUserInfo();

		expect(result).toEqual({
			ipAddress: "192.168.1.1",
			userAgent: "Mozilla/5.0",
		});
	});

	it("should return undefined for user agent if not present", async () => {
		(headers as Mock).mockReturnValue({
			get: (key: string) => {
				if (key === "x-forwarded-for") return "192.168.1.1, 10.0.0.1";
				if (key === "user-agent") return null;
				return null;
			},
		});

		const result = await getLoginUserInfo();

		expect(result).toEqual({
			ipAddress: "192.168.1.1",
			userAgent: undefined,
		});
	});

	it("should return undefined for IP address if x-forwarded-for is not present", async () => {
		(headers as Mock).mockReturnValue({
			get: (key: string) => {
				if (key === "x-forwarded-for") return null;
				if (key === "user-agent") return "Mozilla/5.0";
				return null;
			},
		});

		const result = await getLoginUserInfo();

		expect(result).toEqual({
			ipAddress: undefined,
			userAgent: "Mozilla/5.0",
		});
	});

	it("should return undefined for both IP address and user agent if headers are missing", async () => {
		(headers as Mock).mockReturnValue({
			get: () => null,
		});

		const result = await getLoginUserInfo();

		expect(result).toEqual({
			ipAddress: undefined,
			userAgent: undefined,
		});
	});
});
