import {
	createSignInHandler,
	type SignInDeps,
} from "s-private-backend/auth/sign-in";
// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
const env = {
	LOCAL_AUTH_EMAIL: "developer@local.test",
	LOCAL_AUTH_NAME: "Local Developer",
	LOCAL_AUTH_PASSWORD: "local-development-password",
};
const auth = {
	api: {
		signInEmail: vi.fn<SignInDeps["auth"]["api"]["signInEmail"]>(),
		signUpEmail: vi.fn<SignInDeps["auth"]["api"]["signUpEmail"]>(),
		signInSocial: vi.fn<SignInDeps["auth"]["api"]["signInSocial"]>(),
	},
};
const isLocalDevAuthEnabled = vi.fn(() => false);
const findUser = vi.fn<SignInDeps["findUser"]>();
const seedLocalDevelopmentSampleData = vi.fn<SignInDeps["seedLocalUser"]>();
const GET = createSignInHandler(env, {
	auth,
	isLocalDevAuthEnabled,
	findUser,
	seedLocalUser: seedLocalDevelopmentSampleData,
});

function createSignInRequest() {
	return new Request("http://localhost:3000/api/sign-in");
}

describe("/api/sign-in route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(isLocalDevAuthEnabled).mockReturnValue(false);
	});

	test("signs in an existing local user without contacting Auth0", async () => {
		vi.mocked(isLocalDevAuthEnabled).mockReturnValue(true);
		vi.mocked(findUser).mockResolvedValue({
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
		vi.mocked(findUser).mockResolvedValueOnce(null).mockResolvedValueOnce({
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

	test("repairs sample data for an existing local user", async () => {
		vi.mocked(isLocalDevAuthEnabled).mockReturnValue(true);
		vi.mocked(findUser).mockResolvedValue({
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

		expect(seedLocalDevelopmentSampleData).toHaveBeenCalledWith("local-user");
	});

	test("fails the first sign-in when sample data seeding fails", async () => {
		vi.mocked(isLocalDevAuthEnabled).mockReturnValue(true);
		vi.mocked(findUser).mockResolvedValueOnce(null).mockResolvedValueOnce({
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
		authHeaders.append(
			"set-cookie",
			"better-auth.state_aux=second; Path=/; HttpOnly",
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
		expect(response.headers.getSetCookie()).toHaveLength(2);
		expect(response.headers.get("cache-control")).toBe("private, no-store");
		expect(response.headers.get("location")).toBe(
			"https://example.auth0.com/authorize",
		);
		expect(response.headers.get("set-cookie")).toContain(
			"better-auth.state=test-state",
		);
		expect(seedLocalDevelopmentSampleData).not.toHaveBeenCalled();
	});
});
