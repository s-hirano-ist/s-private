import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { Sharp } from "sharp";
import { afterEach, beforeEach, vi } from "vitest";

afterEach(() => {
	cleanup();
});

beforeEach(() => {
	vi.clearAllMocks();

	vi.mock("@/env", () => ({
		env: {
			NODE_ENV: "test",
			DATABASE_URL: "postgresql://test:test@localhost:5432/test",
			PUSHOVER_URL: "https://example.com",
			PUSHOVER_USER_KEY: "test-key",
			PUSHOVER_APP_TOKEN: "test-token",
			AUTH_SECRET: "test-secret",
			AUTH0_CLIENT_ID: "test-client-id",
			AUTH0_CLIENT_SECRET: "test-client-secret",
			AUTH0_ISSUER_BASE_URL: "https://test.auth0.com",
			SENTRY_AUTH_TOKEN: "test-sentry-token",
			SENTRY_REPORT_URL: "https://example.com/sentry",
			MINIO_HOST: "localhost",
			MINIO_PORT: 9000,
			MINIO_BUCKET_NAME: "test-bucket",
			MINIO_ACCESS_KEY: "test-access-key",
			MINIO_SECRET_KEY: "test-secret-key",
			NEXT_PUBLIC_SENTRY_DSN: "https://example.com/sentry-dsn",
		},
	}));

	vi.mock("@/common/auth/auth", () => ({ auth: vi.fn() }));

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

	vi.mock("@/minio", () => ({
		minioClient: {
			putObject: vi.fn(),
		},
	}));

	vi.mock("@/prisma", () => ({
		default: {
			$extends: vi.fn().mockReturnThis(),
			news: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				count: vi.fn(),
			},
			contents: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				count: vi.fn(),
			},
			images: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				count: vi.fn(),
				$accelerate: {
					invalidate: vi.fn(),
				},
			},
			books: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				count: vi.fn(),
			},
			categories: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
			},
		},
	}));

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
