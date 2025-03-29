import { PAGE_NAME } from "@/constants";
import { RootTab } from "@/features/viewer/components/root-tab";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const displayName = "VIEWER";

export const metadata: Metadata = {
	title: `${displayName} | ${PAGE_NAME}`,
	description: "Private contents viewer.",
};

type Properties = {
	books: ReactNode;
	contents: ReactNode;
	images: ReactNode;
};

export default async function Layout({ books, contents, images }: Properties) {
	return <RootTab books={books} contents={contents} images={images} />;
}
