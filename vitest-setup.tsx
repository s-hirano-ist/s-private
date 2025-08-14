import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { Sharp } from "sharp";
import { afterEach, beforeEach, vi } from "vitest";

afterEach(() => {
	cleanup();
});

beforeEach(() => {
	vi.clearAllMocks();

	vi.mock("@/utils/auth/auth", () => ({ auth: vi.fn() }));

	vi.mock("@/o11y/server", () => ({
		serverLogger: {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		},
		pushoverMonitoringService: {
			notifyInfo: vi.fn(),
			notifyWarning: vi.fn(),
			notifyError: vi.fn(),
		},
	}));

	vi.mock("@/o11y/client", () => ({
		clientLogger: {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		},
	}));

	vi.mock("server-only", () => {
		return {};
	});

	vi.mock("next/cache", () => ({
		revalidatePath: vi.fn(),
	}));

	vi.mock("next/navigation", () => ({
		usePathname: vi.fn(),
		redirect: vi.fn(),
		forbidden: vi.fn(() => {
			throw new Error("FORBIDDEN");
		}),
		unauthorized: vi.fn(() => {
			throw new Error("UNAUTHORIZED");
		}),
	}));

	vi.mock("next/server", () => ({
		NextResponse: {
			json: vi.fn((data) => ({
				json: async () => data,
				status: 200,
				headers: new Headers(),
			})),
		},
	}));

	vi.mock("uuid", () => ({ v7: vi.fn() }));

	type PartialSharp = Pick<Sharp, "metadata" | "resize" | "toBuffer">;
	vi.mock("sharp", () => {
		return {
			__esModule: true,
			default: vi.fn(() => {
				const mockSharp: PartialSharp = {
					metadata: vi.fn().mockResolvedValue({
						width: 800,
						height: 600,
					}),
					resize: vi.fn().mockReturnThis(),
					toBuffer: vi.fn().mockResolvedValue(Buffer.from("thumbnail")),
				};
				return mockSharp;
			}),
		};
	});
});
