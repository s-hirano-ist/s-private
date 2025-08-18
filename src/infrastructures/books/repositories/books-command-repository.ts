import type { Book } from "@/domains/books/entities/books-entity";
import type { IBooksCommandRepository } from "@/domains/books/repositories/books-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import { serverLogger } from "@/infrastructures/observability/server";
import prisma from "@/prisma";

class BooksCommandRepository implements IBooksCommandRepository {
	async create(data: Book) {
		const response = await prisma.book.create({
			data,
		});
		serverLogger.info(
			`【BOOKS】\n\nコンテンツ\nISBN: ${response.ISBN} \ntitle: ${response.title}\nの登録ができました`,
			{ caller: "addBooks", status: 201, userId: response.userId },
			{ notify: true },
		);
	}

	async deleteById(id: Id, userId: UserId, status: Status) {
		const data = await prisma.book.delete({
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
