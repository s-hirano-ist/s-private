import type { Metadata, Viewport } from "next";
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

export default async function Layout({
	articles,
	notes,
	images,
	books,
}: LayoutProps<"/[locale]">) {
	return (
		<RootTab articles={articles} books={books} images={images} notes={notes} />
	);
}
