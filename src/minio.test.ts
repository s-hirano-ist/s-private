import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/env", () => ({
	env: {
		MINIO_HOST: "localhost",
		MINIO_PORT: 9000,
		MINIO_ACCESS_KEY: "minioadmin",
		MINIO_SECRET_KEY: "minioadmin",
	},
}));

vi.mock("minio", () => ({
	Client: class MockMinioClient {
		constructor(config: any) {
			Object.assign(this, config);
		}
	},
}));

describe("minio", () => {
	it("should export a MinIO client instance", async () => {
		const { minioClient } = await import("./minio");

		expect(minioClient).toBeDefined();
		expect(typeof minioClient).toBe("object");
	});

	it("should configure MinIO client with environment variables", async () => {
		const { minioClient } = await import("./minio");

		expect(minioClient.endPoint).toBe("localhost");
		expect(minioClient.port).toBe(9000);
		expect(minioClient.useSSL).toBe(true);
		expect(minioClient.accessKey).toBe("minioadmin");
		expect(minioClient.secretKey).toBe("minioadmin");
	});

	it("should have SSL enabled", async () => {
		const { minioClient } = await import("./minio");

		expect(minioClient.useSSL).toBe(true);
	});
});
