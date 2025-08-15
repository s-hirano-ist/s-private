"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/common/components/ui/tabs";

const TABS = {
	news: "NEWS",
	contents: "CONTENTS",
	images: "IMAGES",
	books: "BOOKS",
};

type Props = {
	books: ReactNode;
	contents: ReactNode;
	images: ReactNode;
	news: ReactNode;
};

const DEFAULT_TAB = "news";

export function RootTab({ news, books, contents, images }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [tab, setTab] = useState(searchParams.get("tab") ?? DEFAULT_TAB);

	const handleTabChange = (value: string) => {
		setTab(value);
		const params = new URLSearchParams(searchParams);
		params.delete("page");
		params.set("tab", value);
		router.replace(`?${params.toString()}`);
	};

	useEffect(() => {
		const tab = searchParams.get("tab");
		if (!tab) return;

		const params = new URLSearchParams(searchParams);
		if (!Object.keys(TABS).includes(tab)) {
			params.delete("tab");
			router.replace(`?${params.toString()}`);
			setTab(DEFAULT_TAB);
		}
	}, [searchParams, router]);

	return (
		<Tabs
			className="mx-auto max-w-5xl sm:px-2"
			defaultValue={DEFAULT_TAB}
			onValueChange={handleTabChange}
			value={tab}
		>
			<TabsList className="w-full">
				{Object.entries(TABS).map(([key, value]) => {
					return (
						<TabsTrigger className="w-full" key={key} value={key}>
							{value}
						</TabsTrigger>
					);
				})}
			</TabsList>
			<TabsContent value="news">{news}</TabsContent>
			<TabsContent value="contents">{contents}</TabsContent>
			<TabsContent value="books"> {books}</TabsContent>
			<TabsContent value="images"> {images}</TabsContent>
		</Tabs>
	);
}
