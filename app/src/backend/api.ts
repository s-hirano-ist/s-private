import { defaultAddArticleDeps } from "@/application-services/articles/add-article.deps";
import { defaultAddBooksDeps } from "@/application-services/books/add-books.deps";
import { defaultAddImageDeps } from "@/application-services/images/add-image.deps";
import { defaultMobileDeps } from "@/application-services/mobile/deps";
import { defaultAddNoteDeps } from "@/application-services/notes/add-note.deps";
import { pushSubscriptionRepository } from "@/application-services/push-notifications/deps";
import { sendPushToSubscription } from "@/application-services/push-notifications/push-notification-service";
import { env } from "@/env";
import { auth } from "@/infrastructures/auth/auth";
import "server-only";
import { searchVectors } from "@/infrastructures/search/search-service";
import { booksStorageService } from "@/infrastructures/shared/storage/books-storage-service";
import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";
import prisma from "@/prisma";
import { createApiApp } from "@s-hirano-ist/s-backend/api/app";
import { createPushService } from "@s-hirano-ist/s-backend/api/push-service";
import { createReadService } from "@s-hirano-ist/s-backend/api/read-service";
import { createUploadService } from "@s-hirano-ist/s-backend/api/upload-service";
import { createWriteService } from "@s-hirano-ist/s-backend/api/write-service";
import { authenticateMobileRequest } from "@s-hirano-ist/s-backend/auth/mobile-auth";
import * as Sentry from "@sentry/nextjs";

const writes = createWriteService({
	articles: defaultAddArticleDeps,
	notes: defaultAddNoteDeps,
	images: defaultAddImageDeps,
	books: defaultAddBooksDeps,
	mobile: defaultMobileDeps,
});
const uploads = createUploadService(defaultMobileDeps, writes);
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
	{
		writes,
		uploads,
		push: createPushService(
			pushSubscriptionRepository,
			env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
			sendPushToSubscription,
		),
	},
);
