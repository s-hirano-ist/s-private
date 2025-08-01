"use client";
import { type ReactNode } from "react";
import { UnifiedRootTab } from "@/components/composition/unified-root-tab";

const TABS = {
	news: "NEWS",
	books: "BOOKS",
	contents: "CONTENTS",
	images: "IMAGES",
};

type Props = {
	books: ReactNode;
	contents: ReactNode;
	images: ReactNode;
	news: ReactNode;
};

const DEFAULT_TAB = "news";

export function RootTab({ news, books, contents, images }: Props) {
	return (
		<UnifiedRootTab defaultTab={DEFAULT_TAB} tabs={TABS}>
			<UnifiedRootTab.Content value="news">{news}</UnifiedRootTab.Content>
			<UnifiedRootTab.Content value="books">{books}</UnifiedRootTab.Content>
			<UnifiedRootTab.Content value="contents">
				{contents}
			</UnifiedRootTab.Content>
			<UnifiedRootTab.Content value="images">{images}</UnifiedRootTab.Content>
		</UnifiedRootTab>
	);
}
