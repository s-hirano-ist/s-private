import { auth } from "@/infrastructures/auth/auth";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/infrastructures/auth/auth", () => ({
	auth: { api: { signInSocial: vi.fn() } },
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

describe("/api/sign-in route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
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

		const response = await GET();

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
	});
});
