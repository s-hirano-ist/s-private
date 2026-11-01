import type { MediaCreationInput } from "@s-hirano-ist/s-application/content/media-input";
import type {
	ISBN,
	BookTitle,
	Rating,
	Tags,
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import type { Path } from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
export type BookCreationInput = MediaCreationInput & {
	isbn: ISBN;
	title: BookTitle;
	rating: Rating;
	tags: Tags;
	imagePath: Path;
};
