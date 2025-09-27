import { DuplicateError, UnexpectedError } from "@/common/error/error-classes";
import type { IBooksQueryRepository } from "@/domains/books/repositories/books-query-repository.interface";
import type { UserId } from "@/domains/common/entities/common-entity";
import {
	type BookMarkdown,
	type BookTitle,
	bookEntity,
	type GoogleAuthors,
	type GoogleDescription,
	type GoogleHref,
	type GoogleImgSrc,
	type GoogleSubtitle,
	type GoogleTitle,
	type ISBN,
	UnexportedBook,
} from "../entities/books-entity";

async function ensureNoDuplicateBook(
	booksQueryRepository: IBooksQueryRepository,
	ISBN: ISBN,
	userId: UserId,
): Promise<void> {
	const exists = await booksQueryRepository.findByISBN(ISBN, userId);
	if (exists !== null) throw new DuplicateError();
}

type BookStatus = "NEED_CREATE" | "NEED_UPDATE";
type ReturnType =
	| { status: BookStatus; data: UnexportedBook }
	| { status: "NO_UPDATE" };

async function updateBook(
	booksQueryRepository: IBooksQueryRepository,
	ISBN: ISBN,
	userId: UserId,
	title: BookTitle,
	googleTitle: GoogleTitle,
	googleSubTitle: GoogleSubtitle,
	googleAuthors: GoogleAuthors,
	googleDescription: GoogleDescription,
	googleImgSrc: GoogleImgSrc,
	googleHref: GoogleHref,
	markdown: BookMarkdown,
): Promise<ReturnType> {
	const data = await booksQueryRepository.findByISBN(ISBN, userId);
	if (data?.status !== "UNEXPORTED") return { status: "NO_UPDATE" };

	if (!data) {
		return {
			status: "NEED_CREATE",
			data: bookEntity.create({ userId, ISBN, title }),
		};
	}
	const newData = UnexportedBook.safeParse(data);
	if (!newData.success) throw new UnexpectedError();

	if (
		data.title !== title ||
		data.googleTitle !== googleTitle ||
		data.googleSubTitle !== googleSubTitle ||
		JSON.stringify(data.googleAuthors) !== JSON.stringify(googleAuthors) ||
		data.googleDescription !== googleDescription ||
		data.googleImgSrc !== googleImgSrc ||
		data.googleHref !== googleHref ||
		data.markdown !== markdown
	) {
		return {
			status: "NEED_UPDATE",
			data: bookEntity.update(newData.data, {
				title,
				googleTitle,
				googleSubtitle: googleSubTitle,
				googleAuthors,
				googleDescription,
				googleImgSrc,
				googleHref,
				markdown,
			}),
		};
	}
	return { status: "NO_UPDATE" };
}

export class BooksDomainService {
	constructor(private readonly booksQueryRepository: IBooksQueryRepository) {}

	public async ensureNoDuplicate(ISBN: ISBN, userId: UserId) {
		return ensureNoDuplicateBook(this.booksQueryRepository, ISBN, userId);
	}

	public async updateBook(
		ISBN: ISBN,
		userId: UserId,
		title: BookTitle,
		googleTitle: GoogleTitle,
		googleSubTitle: GoogleSubtitle,
		googleAuthors: GoogleAuthors,
		googleDescription: GoogleDescription,
		googleImgSrc: GoogleImgSrc,
		googleHref: GoogleHref,
		markdown: BookMarkdown,
	) {
		return updateBook(
			this.booksQueryRepository,
			ISBN,
			userId,
			title,
			googleTitle,
			googleSubTitle,
			googleAuthors,
			googleDescription,
			googleImgSrc,
			googleHref,
			markdown,
		);
	}
}
