import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PAGE_NAME } from "@/common/constants";
import { RootTab } from "@/components/root-tab";

const displayName = "DUMPER";

export const metadata: Metadata = {
	title: `${displayName} | ${PAGE_NAME}`,
	description: "Contents dumper.",
};

type Props = {
	news: ReactNode;
	contents: ReactNode;
	images: ReactNode;
	books: ReactNode;
};

export default async function Layout({ news, contents, images, books }: Props) {
	return (
		<RootTab books={books} contents={contents} images={images} news={news} />
	);
}
