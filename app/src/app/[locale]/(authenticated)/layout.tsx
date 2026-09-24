import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { addArticle } from "@/application-services/articles/add-article";
import { addBooks } from "@/application-services/books/add-books";
import { addImage } from "@/application-services/images/add-image";
import { addNote } from "@/application-services/notes/add-note";
import { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { PAGE_NAME } from "@/common/constants";
import { AppNavigation } from "@/components/common/layouts/nav/app-navigation";
import { ArticleFormLoader } from "@/loaders/articles/article-form-loader";
import { BooksFormLoader } from "@/loaders/books/books-form-loader";
import { ImageFormLoader } from "@/loaders/images/image-form-loader";
import { NoteFormLoader } from "@/loaders/notes/note-form-loader";

export const metadata: Metadata = {
	title: PAGE_NAME,
	description: "Knowledge dumper and viewer.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="mx-auto max-w-5xl pb-24 sm:px-2">
			<AppNavigation
				forms={{
					articles: <ArticleFormLoader addArticle={addArticle} />,
					books: <BooksFormLoader addBooks={addBooks} />,
					images: <ImageFormLoader addImage={addImage} />,
					notes: <NoteFormLoader addNote={addNote} />,
				}}
				search={searchContentFromClient}
			/>
			{children}
		</div>
	);
}
