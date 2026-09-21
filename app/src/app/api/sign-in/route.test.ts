import type { NextRequest } from "next/server";
import { env } from "@/env";
import { auth, isLocalDevAuthEnabled } from "@/infrastructures/auth/auth";
import prisma from "@/prisma";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/application-services/local-development/seed-sample-data", () => ({
	seedLocalDevelopmentSampleData: vi.fn(),
}));

vi.mock("@/infrastructures/auth/auth", () => ({
	auth: {
		api: {
			signInEmail: vi.fn(),
			signInSocial: vi.fn(),
			signUpEmail: vi.fn(),
		},
	},
	isLocalDevAuthEnabled: vi.fn(() => false),
}));

vi.mock("next/headers", () => ({
	headers: vi.fn().mockResolvedValue(new Headers({ host: "example.com" })),
}));

vi.mock("next/server", () => ({
	NextResponse: {
		redirect: vi.fn(
			(url: string | URL) =>
				new Response(null, {
					headers: { location: url.toString() },
					status: 307,
				}),
		),
	},
}));

const { GET } = await import("./route");
const { seedLocalDevelopmentSampleData } =
	await import("@/application-services/local-development/seed-sample-data");

function createSignInRequest() {
	return new Request("http://localhost:3000/api/sign-in") as NextRequest;
}

describe("/api/sign-in route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(isLocalDevAuthEnabled).mockReturnValue(false);
	});

	test("signs in an existing local user without contacting Auth0", async () => {
		vi.mocked(isLocalDevAuthEnabled).mockReturnValue(true);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "local-user",
			email: "developer@local.test",
			emailVerified: false,
			name: "Local Developer",
			image: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		const authHeaders = new Headers({
			"set-cookie": "better-auth.session_token=local; Path=/; HttpOnly",
		});
		vi.mocked(auth.api.signInEmail).mockResolvedValue({
			response: {},
			headers: authHeaders,
		} as unknown as Awaited<ReturnType<typeof auth.api.signInEmail>>);

		const response = await GET(createSignInRequest());

		expect(auth.api.signInEmail).toHaveBeenCalledWith({
			body: {
				email: env.LOCAL_AUTH_EMAIL,
				password: env.LOCAL_AUTH_PASSWORD,
			},
			headers: expect.any(Headers),
			returnHeaders: true,
		});
		expect(auth.api.signInSocial).not.toHaveBeenCalled();
		expect(response.headers.get("location")).toBe("http://localhost:3000/");
		expect(response.headers.get("set-cookie")).toContain("session_token");
	});

	test("creates the local user on first sign-in", async () => {
		vi.mocked(isLocalDevAuthEnabled).mockReturnValue(true);
		vi.mocked(prisma.user.findUnique)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({
				id: "local-user",
				email: "developer@local.test",
				emailVerified: false,
				name: "Local Developer",
				image: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		vi.mocked(auth.api.signUpEmail).mockResolvedValue({
			response: {},
			headers: new Headers({ "set-cookie": "local=session" }),
		} as unknown as Awaited<ReturnType<typeof auth.api.signUpEmail>>);

		await GET(createSignInRequest());

		expect(auth.api.signUpEmail).toHaveBeenCalledWith({
			body: {
				email: env.LOCAL_AUTH_EMAIL,
				name: env.LOCAL_AUTH_NAME,
				password: env.LOCAL_AUTH_PASSWORD,
			},
			headers: expect.any(Headers),
			returnHeaders: true,
		});
		expect(auth.api.signInEmail).not.toHaveBeenCalled();
		expect(seedLocalDevelopmentSampleData).toHaveBeenCalledWith("local-user");
	});

	test("does not seed for an existing local user", async () => {
		vi.mocked(isLocalDevAuthEnabled).mockReturnValue(true);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "local-user",
			email: "developer@local.test",
			emailVerified: false,
			name: "Local Developer",
			image: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		vi.mocked(auth.api.signInEmail).mockResolvedValue({
			response: {},
			headers: new Headers(),
		} as unknown as Awaited<ReturnType<typeof auth.api.signInEmail>>);

		await GET(createSignInRequest());

		expect(seedLocalDevelopmentSampleData).not.toHaveBeenCalled();
	});

	test("fails the first sign-in when sample data seeding fails", async () => {
		vi.mocked(isLocalDevAuthEnabled).mockReturnValue(true);
		vi.mocked(prisma.user.findUnique)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({
				id: "local-user",
				email: "developer@local.test",
				emailVerified: false,
				name: "Local Developer",
				image: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		vi.mocked(auth.api.signUpEmail).mockResolvedValue({
			response: {},
			headers: new Headers({ "set-cookie": "local=session" }),
		} as unknown as Awaited<ReturnType<typeof auth.api.signUpEmail>>);
		vi.mocked(seedLocalDevelopmentSampleData).mockRejectedValue(
			new Error("MinIO is unavailable"),
		);

		await expect(GET(createSignInRequest())).rejects.toThrow(
			"MinIO is unavailable",
		);
	});

	test("starts the Auth0 social flow and forwards state cookies", async () => {
		const authHeaders = new Headers();
		authHeaders.append(
			"set-cookie",
			"better-auth.state=test-state; Path=/; HttpOnly; SameSite=Lax",
		);
		vi.mocked(auth.api.signInSocial).mockResolvedValue({
			response: {
				redirect: true,
				url: "https://example.auth0.com/authorize",
			},
			headers: authHeaders,
		} as unknown as Awaited<ReturnType<typeof auth.api.signInSocial>>);

		const response = await GET(createSignInRequest());

		expect(auth.api.signInSocial).toHaveBeenCalledWith({
			body: { provider: "auth0", callbackURL: "/" },
			headers: expect.any(Headers),
			returnHeaders: true,
		});
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe(
			"https://example.auth0.com/authorize",
		);
		expect(response.headers.get("set-cookie")).toContain(
			"better-auth.state=test-state",
		);
		expect(seedLocalDevelopmentSampleData).not.toHaveBeenCalled();
	});
});
