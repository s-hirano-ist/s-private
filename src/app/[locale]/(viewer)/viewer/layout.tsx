import { PAGE_NAME } from "@/constants";
import { RootTab } from "@/features/viewer/components/root-tab";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const displayName = "VIEWER";

export const metadata: Metadata = {
	title: `${displayName} | ${PAGE_NAME}`,
	description: "Private contents viewer.",
};

type Props = {
	books: ReactNode;
	contents: ReactNode;
	images: ReactNode;
	news: ReactNode;
};

export default async function Layout({ books, contents, images, news }: Props) {
	return (
		<RootTab books={books} contents={contents} images={images} news={news} />
	);
}
