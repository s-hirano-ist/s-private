import type { ApiAuth } from "@s-hirano-ist/s-backend/api/app";
import type {
	createBackendAuth,
	AuthConfig,
} from "@s-hirano-ist/s-backend/auth/web-auth";
import type { MobileDeps } from "@s-hirano-ist/s-backend/mobile/deps";
import type { ErrorReporter } from "@s-hirano-ist/s-backend/observability/reporter";
import { authenticateMobileRequest } from "@s-hirano-ist/s-backend/auth/mobile-auth";

export function createApiAuth(
	config: AuthConfig & { MOBILE_API_AUDIENCE?: string },
	auth: ReturnType<typeof createBackendAuth>["auth"],
	mobile: MobileDeps,
	reporter: Pick<ErrorReporter, "captureException">,
): ApiAuth {
	return {
		authenticateBearer: (request) =>
			authenticateMobileRequest(request, config, mobile),
		async getWebSession(headers) {
			const { response, headers: responseHeaders } = await auth.api.getSession({
				headers,
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
			if (origin === new URL(config.BETTER_AUTH_URL).origin) return true;
			try {
				const url = new URL(origin);
				return (
					config.VERCEL === "1" &&
					url.origin === origin &&
					url.protocol === "https:" &&
					/^s-private-[a-z0-9-]+-s-hirano-ist-team\.vercel\.app$/u.test(
						url.hostname,
					)
				);
			} catch {
				return false;
			}
		},
		reportError(error) {
			reporter.captureException(error);
		},
	};
}
