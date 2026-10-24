import "server-only";
import { defaultMobileDeps } from "@/application-services/mobile/deps";
import { env } from "@/env";
import { auth } from "@/infrastructures/auth/auth";
import { searchVectors } from "@/infrastructures/search/search-service";
import { booksStorageService } from "@/infrastructures/shared/storage/books-storage-service";
import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";
import prisma from "@/prisma";
import { createApiApp } from "@s-hirano-ist/s-backend/api/app";
import { createReadService } from "@s-hirano-ist/s-backend/api/read-service";
import { authenticateMobileRequest } from "@s-hirano-ist/s-backend/auth/mobile-auth";
import * as Sentry from "@sentry/nextjs";

// Transitional composition root. The shared API itself never imports Next.js.
export const backendApi = createApiApp(
	{
		authenticateBearer: (request) =>
			authenticateMobileRequest(request, env, defaultMobileDeps),
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
			if (origin === new URL(env.BETTER_AUTH_URL).origin) return true;
			try {
				const url = new URL(origin);
				return (
					env.VERCEL === "1" &&
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
			Sentry.captureException(error);
		},
	},
	createReadService({
		database: prisma,
		mobile: defaultMobileDeps,
		storage: { images: minioStorageService, books: booksStorageService },
		searchVectors,
	}),
);
