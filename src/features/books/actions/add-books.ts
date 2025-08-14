"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { booksCommandRepository } from "@/features/books/repositories/books-command-repository";
import { validateBooks } from "@/features/books/utils/validate-books";
import { serverLogger } from "@/o11y/server";
import type { ServerAction } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { formatCreateBooksMessage } from "@/utils/notification/format-for-notification";

type Books = {
	ISBN: string;
	title: string;
};

export async function addBooks(
	formData: FormData,
): Promise<ServerAction<Books>> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const validatedBooks = validateBooks(formData);

		const createdBooks = await booksCommandRepository.create({
			userId,
			...validatedBooks,
		});

		const message = formatCreateBooksMessage(createdBooks);
		const context = {
			caller: "addBooks" as const,
			status: 201 as const,
			userId,
		};
		serverLogger.info(message, context, { notify: true });
		revalidatePath("/(dumper)");

		return {
			success: true,
			message: "inserted",
			data: {
				ISBN: createdBooks.ISBN,
				title: createdBooks.title,
			},
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
