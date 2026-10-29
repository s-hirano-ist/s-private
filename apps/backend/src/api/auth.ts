import type { ApiAuth } from "s-private-backend/api/types";
import type {
	createBackendAuth,
	AuthConfig,
} from "s-private-backend/auth/web-auth";
import type { MobileDeps } from "s-private-backend/mobile/deps";
import type { ErrorReporter } from "s-private-backend/observability/reporter";
import { getSessionCookie } from "better-auth/cookies";
import { authenticateMobileRequest } from "s-private-backend/auth/mobile-auth";
import { isTrustedWebOrigin } from "s-private-backend/auth/web-origin";

export function createApiAuth(
	config: AuthConfig & { MOBILE_API_AUDIENCE?: string },
	getAuth: ReturnType<typeof createBackendAuth>["getAuth"],
	mobile: MobileDeps,
	reporter: Pick<ErrorReporter, "captureException">,
): ApiAuth {
	return {
		authenticateBearer: (request) =>
			authenticateMobileRequest(request, config, mobile),
		async getWebSession(headers) {
			// Anonymous API requests must not depend on Auth0 discovery availability.
			if (!getSessionCookie(headers)) return { session: null };
			const origin =
				headers.get("x-s-private-web-origin") ??
				headers.get("origin") ??
				config.BETTER_AUTH_URL;
			if (!origin || !isTrustedWebOrigin(origin, config))
				return { session: null };
			const publicHeaders = new Headers(headers);
			for (const name of [
				"x-s-private-web-origin",
				"x-forwarded-host",
				"x-forwarded-proto",
				"forwarded",
			])
				publicHeaders.delete(name);
			publicHeaders.set("host", new URL(origin).host);
			const auth = await getAuth();
			const { response, headers: responseHeaders } = await auth.api.getSession({
				headers: publicHeaders,
				returnHeaders: true,
			});
			return {
				session: response
					? {
							user: {
								id: response.user.id,
								name: response.user.name,
								email: response.user.email,
								image: response.user.image ?? null,
							},
							expiresAt: response.session.expiresAt.toISOString(),
						}
					: null,
				headers: responseHeaders,
			};
		},
		isTrustedOrigin(origin) {
			return isTrustedWebOrigin(origin, config);
		},
		reportError(error) {
			reporter.captureException(error);
		},
	};
}
