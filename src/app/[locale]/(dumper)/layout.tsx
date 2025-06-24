import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PAGE_NAME } from "@/constants";
import { RootTab } from "@/features/dump/components/root-tab";

const displayName = "DUMPER";

export const metadata: Metadata = {
	title: `${displayName} | ${PAGE_NAME}`,
	description: "Contents dumper.",
};

type Props = {
	contents: ReactNode;
	dump: ReactNode;
	image: ReactNode;
	news: ReactNode;
};

export default async function Layout({ news, contents, dump, image }: Props) {
	return <RootTab contents={contents} dump={dump} image={image} news={news} />;
}
