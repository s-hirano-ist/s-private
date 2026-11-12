"use server";
import "server-only";
import { requireAuth } from "@/common/auth/session";
import { contentCacheTag } from "@/common/cache/content-cache";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";

/** Completes the browser cache lifecycle after the authenticated upload API succeeds. */
export async function invalidateUploadedContent(
	domain: "images" | "books",
): Promise<void> {
	const parsedDomain = z.enum(["images", "books"]).parse(domain);
	await requireAuth();
	updateTag(contentCacheTag(parsedDomain));
	refresh();
}
