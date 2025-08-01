"use client";
import { type ReactNode } from "react";
import { UnifiedRootTab } from "@/components/composition/unified-root-tab";

const TABS = {
	news: "NEWS",
	contents: "CONTENTS",
	image: "IMAGE",
	dump: "DUMP",
};

type Props = {
	contents: ReactNode;
	dump: ReactNode;
	image: ReactNode;
	news: ReactNode;
};

const DEFAULT_TAB = "news";

export function RootTab({ news, contents, dump, image }: Props) {
	return (
		<UnifiedRootTab defaultTab={DEFAULT_TAB} tabs={TABS}>
			<UnifiedRootTab.Content value="news">{news}</UnifiedRootTab.Content>
			<UnifiedRootTab.Content value="contents">
				{contents}
			</UnifiedRootTab.Content>
			<UnifiedRootTab.Content value="image">{image}</UnifiedRootTab.Content>
			<UnifiedRootTab.Content value="dump">{dump}</UnifiedRootTab.Content>
		</UnifiedRootTab>
	);
}
