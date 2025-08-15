import type { BooksFormSchema } from "@/domains/books/entities/books-entity";
import type { IBooksCommandRepository } from "@/domains/books/types";
import type { Status } from "@/domains/common/entities/common-entity";
import { serverLogger } from "@/o11y/server";
import prisma from "@/prisma";

class BooksCommandRepository implements IBooksCommandRepository {
	// Domain interface implementation
	async create(data: BooksFormSchema): Promise<void> {
		const response = await prisma.books.create({
			data,
		});
		serverLogger.info(
			`【BOOKS】\n\nコンテンツ\nISBN: ${response.ISBN} \ntitle: ${response.title}\nの登録ができました`,
			{ caller: "addBooks", status: 201, userId: response.userId },
			{ notify: true },
		);
	}

	async deleteById(id: string, userId: string, status: Status): Promise<void> {
		const data = await prisma.books.delete({
			where: { id, userId, status },
			select: { title: true },
		});
		serverLogger.info(
			`【BOOKS】\n\n削除\ntitle: ${data.title}`,
			{ caller: "deleteBooks", status: 200, userId },
			{ notify: true },
		);
	}
}

export const booksCommandRepository = new BooksCommandRepository();
