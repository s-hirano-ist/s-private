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
import { createApiAuth } from "@s-hirano-ist/s-backend/api/auth";
import { createApiServices } from "@s-hirano-ist/s-backend/api/composition";
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
	createApiAuth(env, auth, services.mobile, Sentry),
	services.reads,
	services.mutations,
);
