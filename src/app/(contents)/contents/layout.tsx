import { Header } from "@/components/nav/header";
import { PAGE_NAME } from "@/constants";
import { RootTab } from "@/features/contents/components/root-tab";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const displayName = "CONTENTS";

export const metadata: Metadata = {
	title: `${displayName} | ${PAGE_NAME}`,
	description: "Private contents",
};

type Props = {
	books: ReactNode;
	notes: ReactNode;
	images: ReactNode;
};

export default async function Layout({ books, notes, images }: Props) {
	return (
		<>
			<Header title={displayName} />
			<RootTab books={books} notes={notes} images={images} />
		</>
	);
}
