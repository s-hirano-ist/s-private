import { env } from "@/env";
import { auth } from "@/infrastructures/auth/auth";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { minioMobileChunkStore } from "@/infrastructures/mobile/minio-mobile-chunk-store";
import { searchVectors } from "@/infrastructures/search/search-service";
import "server-only";
import { booksStorageService } from "@/infrastructures/shared/storage/books-storage-service";
import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";
import prisma from "@/prisma";
import { createApiApp } from "@s-hirano-ist/s-backend/api/app";
import { createApiServices } from "@s-hirano-ist/s-backend/api/composition";
import { authenticateMobileRequest } from "@s-hirano-ist/s-backend/auth/mobile-auth";
import * as Sentry from "@sentry/nextjs";

const services = createApiServices({
	database: prisma,
	chunks: minioMobileChunkStore,
	storage: { images: minioStorageService, books: booksStorageService },
	eventDispatcher,
	searchVectors,
	push: env,
	reporter: Sentry,
});
// Transitional composition root. The shared API itself never imports Next.js.
export const backendApi = createApiApp(
	{
		authenticateBearer: (request) =>
			authenticateMobileRequest(request, env, services.mobile),
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
	services.reads,
	services.mutations,
);
