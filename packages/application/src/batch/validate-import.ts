import type { ImportChange } from "@s-hirano-ist/s-application/batch/import-models";
import * as articles from "@s-hirano-ist/s-core/articles/entities/article-entity";
import * as books from "@s-hirano-ist/s-core/books/entities/book-entity";
import * as notes from "@s-hirano-ist/s-core/notes/entities/note-entity";
import { Path } from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
/** Apply domain constraints to incoming data without reconstructing stored entities. */
export function validateImport(change: ImportChange): void {
	switch (change.domain) {
		case "articles":
			articles.ArticleTitle.parse(change.values.title);
			articles.Url.parse(change.values.url);
			articles.CategoryName.parse(change.values.categoryName);
			articles.Quote.parse(change.values.quote);
			articles.OgTitle.parse(change.values.ogTitle);
			articles.OgDescription.parse(change.values.ogDescription);
			articles.OgImageUrl.parse(change.values.ogImageUrl);
			break;
		case "notes":
			notes.NoteTitle.parse(change.values.title);
			notes.Markdown.parse(change.values.markdown);
			break;
		case "books":
			books.ISBN.parse(change.values.isbn);
			books.BookTitle.parse(change.values.title);
			books.Rating.parse(change.values.rating);
			books.Tags.parse(change.values.tags);
			break;
		case "images":
			Path.parse(change.values.path);
			break;
	}
}
