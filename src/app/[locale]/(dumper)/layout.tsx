import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PAGE_NAME } from "@/common/constants";
import { RootTab } from "@/components/common/layouts/nav/root-tab";

export const metadata: Metadata = {
	title: `${PAGE_NAME}`,
	description: "Knowledge dumper and viewer.",
};

type Props = {
	articles: ReactNode;
	contents: ReactNode;
	images: ReactNode;
	books: ReactNode;
};

export default async function Layout({
	articles,
	contents,
	images,
	books,
}: Props) {
	return (
		<RootTab
			books={books}
			contents={contents}
			images={images}
			articles={articles}
		/>
	);
}
