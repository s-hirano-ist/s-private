"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { validateBooks } from "@/features/books/utils/validate-books";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { serverLogger } from "@/o11y/server";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { wrapServerSideErrorForClient } from "@/utils/error/error-wrapper";
import type { ServerAction } from "@/utils/types";

export type Books = {
	ISBN: string;
	title: string;
};

export async function addBooks(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const validatedBooks = validateBooks(formData);

		const createdBooks = await booksCommandRepository.create({
			userId,
			...validatedBooks,
		});

		serverLogger.info(
			`【BOOKS】\n\nコンテンツ\nISBN: ${createdBooks.ISBN} \ntitle: ${createdBooks.title}\nの登録ができました`,
			{ caller: "addBooks", status: 201, userId },
			{ notify: true },
		);
		revalidatePath("/(dumper)");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
