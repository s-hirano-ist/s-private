import { DuplicateError, UnexpectedError } from "@/common/error/error-classes";
import type { IBooksQueryRepository } from "@/domains/books/repositories/books-query-repository.interface";
import {
	makeUserId,
	type UserId,
} from "@/domains/common/entities/common-entity";
import {
	type BookMarkdown,
	type BookTitle,
	bookEntity,
	type GoogleAuthors,
	type GoogleDescription,
	type GoogleHref,
	type GoogleImgSrc,
	type GoogleSubTitle,
	type GoogleTitle,
	type ISBN,
	makeISBN,
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

type BookStatus = "NEED_CREATE" | "NEED_UPDATE" | "NO_UPDATE";

async function changeBookStatus(
	booksQueryRepository: IBooksQueryRepository,
	ISBN: ISBN,
	userId: UserId,
	title: BookTitle,
	googleTitle: GoogleTitle,
	googleSubTitle: GoogleSubTitle,
	googleAuthors: GoogleAuthors,
	googleDescription: GoogleDescription,
	googleImgSrc: GoogleImgSrc,
	googleHref: GoogleHref,
	markdown: BookMarkdown,
): Promise<{ status: BookStatus; data: UnexportedBook }> {
	const data = await booksQueryRepository.findByISBN(
		makeISBN(ISBN),
		makeUserId(userId),
	);
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
				googleSubTitle,
				googleAuthors,
				googleDescription,
				googleImgSrc,
				googleHref,
				markdown,
			}),
		};
	}
	return { status: "NO_UPDATE", data: newData.data };
}

export class BooksDomainService {
	constructor(private readonly booksQueryRepository: IBooksQueryRepository) {}

	public async ensureNoDuplicate(ISBN: ISBN, userId: UserId) {
		return ensureNoDuplicateBook(this.booksQueryRepository, ISBN, userId);
	}

	public async changeBookStatus(
		ISBN: ISBN,
		userId: UserId,
		title: BookTitle,
		googleTitle: GoogleTitle,
		googleSubTitle: GoogleSubTitle,
		googleAuthors: GoogleAuthors,
		googleDescription: GoogleDescription,
		googleImgSrc: GoogleImgSrc,
		googleHref: GoogleHref,
		markdown: BookMarkdown,
	) {
		return changeBookStatus(
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
