import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootTab } from "@/common/components/nav/root-tab";
import { PAGE_NAME } from "@/common/constants";

const displayName = "VIEWER";

export const metadata: Metadata = {
	title: `${displayName} | ${PAGE_NAME}`,
	description: "Private contents viewer.",
};

type Props = {
	news: ReactNode;
	contents: ReactNode;
	images: ReactNode;
	books: ReactNode;
};

export default async function Layout({ books, contents, images, news }: Props) {
	return (
		<RootTab books={books} contents={contents} images={images} news={news} />
	);
}
