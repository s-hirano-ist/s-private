import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PAGE_NAME } from "@/common/constants";
import { RootTab } from "@/components/common/layouts/nav/root-tab";

export const metadata: Metadata = {
	title: `${PAGE_NAME}`,
	description: "Knowledge dumper and viewer.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

type Props = {
	articles: ReactNode;
	notes: ReactNode;
	images: ReactNode;
	books: ReactNode;
};

export default async function Layout({
	articles,
	notes,
	images,
	books,
}: Props) {
	return (
		<RootTab articles={articles} books={books} images={images} notes={notes} />
	);
}
