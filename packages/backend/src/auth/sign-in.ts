import type { createBackendAuth } from "@s-hirano-ist/s-backend/auth/web-auth";

export type SignInConfig = {
	LOCAL_AUTH_EMAIL?: string;
	LOCAL_AUTH_NAME?: string;
	LOCAL_AUTH_PASSWORD?: string;
};
export type SignInDeps = {
	auth: {
		api: Pick<
			ReturnType<typeof createBackendAuth>["auth"]["api"],
			"signInEmail" | "signUpEmail" | "signInSocial"
		>;
	};
	findUser(email: string): Promise<{ id: string } | null>;
	isLocalDevAuthEnabled(): boolean;
	seedLocalUser(userId: string): Promise<void>;
};

function redirectWithCookies(url: string | URL, authHeaders: Headers) {
	const responseHeaders = new Headers({
		location: url.toString(),
		"cache-control": "private, no-store",
	});
	for (const cookie of authHeaders.getSetCookie())
		responseHeaders.append("set-cookie", cookie);
	return new Response(null, { status: 307, headers: responseHeaders });
}

/** Keep every OAuth state cookie on the redirect so Better Auth can verify its callback. */
export function createSignInHandler(config: SignInConfig, deps: SignInDeps) {
	return async function GET(request: Request): Promise<Response> {
		const requestHeaders = request.headers;

		if (deps.isLocalDevAuthEnabled()) {
			const email = config.LOCAL_AUTH_EMAIL;
			const password = config.LOCAL_AUTH_PASSWORD;
			const name = config.LOCAL_AUTH_NAME;
			if (!email || !password || !name) {
				throw new Error("Local authentication configuration is incomplete");
			}

			const existingUser = await deps.findUser(email);
			if (existingUser) {
				const result = await deps.auth.api.signInEmail({
					body: { email, password },
					headers: requestHeaders,
					returnHeaders: true,
				});
				await deps.seedLocalUser(existingUser.id);
				return redirectWithCookies(new URL("/", request.url), result.headers);
			}

			const result = await deps.auth.api.signUpEmail({
				body: { email, name, password },
				headers: requestHeaders,
				returnHeaders: true,
			});
			const createdUser = await deps.findUser(email);
			if (!createdUser) {
				throw new Error(
					"Local user creation completed but the user could not be loaded for sample data seeding",
				);
			}
			await deps.seedLocalUser(createdUser.id);

			return redirectWithCookies(new URL("/", request.url), result.headers);
		}

		const { response, headers: authHeaders } = await deps.auth.api.signInSocial(
			{
				body: { provider: "auth0", callbackURL: "/" },
				headers: requestHeaders,
				returnHeaders: true,
			},
		);
		if (!response.url) {
			throw new Error("Auth0 sign-in did not return a redirect URL");
		}

		return redirectWithCookies(response.url, authHeaders);
	};
}
