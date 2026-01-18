/**
 * Image upload server action.
 *
 * @module
 */

"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { addImageCore } from "./add-image.core";
import { defaultAddImageDeps } from "./add-image.deps";

/**
 * Server action to upload a new image.
 *
 * @remarks
 * This is the public-facing Server Action that handles authentication and authorization,
 * then delegates to addImageCore for business logic.
 *
 * Performs the following steps:
 * 1. Permission check (dumper role required)
 * 2. Form data parsing with thumbnail generation
 * 3. Domain duplicate check (path uniqueness)
 * 4. Upload original and thumbnail to MinIO
 * 5. Create database record and invalidate cache
 *
 * @param formData - Form data containing the image file
 * @returns Server action result with success/failure status
 */
export async function addImage(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	return addImageCore(formData, defaultAddImageDeps);
}
