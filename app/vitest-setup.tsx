import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
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

	vi.mock("@/common/auth/auth", () => ({
		auth: vi.fn((handler) => handler),
	}));

	vi.mock("@/infrastructures/observability/server", () => ({
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

	vi.mock("server-only", () => {
		return {};
	});

	vi.mock("next/cache", () => ({
		cacheTag: vi.fn(),
		revalidateTag: vi.fn(),
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
			json: vi.fn((data, options = {}) => ({
				json: async () => data,
				status: options.status || 200,
				headers: new Headers(),
			})),
		},
	}));

	vi.mock("@/minio", () => ({
		minioClient: {
			putObject: vi.fn(),
			getObject: vi.fn(),
			statObject: vi.fn(),
			removeObject: vi.fn(),
		},
	}));

	vi.mock("@/prisma", () => ({
		default: {
			$extends: vi.fn().mockReturnThis(),
			article: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				count: vi.fn(),
			},
			note: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				count: vi.fn(),
			},
			image: {
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
			book: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				count: vi.fn(),
			},
			category: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
			},
		},
	}));
});
