import { PAGE_NAME } from "@/constants";
import { RootTab } from "@/features/dump/components/root-tab";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const displayName = "DUMPER";

export const metadata: Metadata = {
	title: `${displayName} | ${PAGE_NAME}`,
	description: "Dump news and contents data.",
};

type Props = {
	news: ReactNode;
	contents: ReactNode;
	dump: ReactNode;
	image: ReactNode;
};

export default async function Layout({ news, contents, dump, image }: Props) {
	return <RootTab news={news} contents={contents} dump={dump} image={image} />;
}
