"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransitionRouter } from "next-view-transitions";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

const TABS = {
	news: "NEWS",
	contents: "CONTENTS",
	image: "IMAGE",
	dump: "DUMP",
};

type Props = {
	news: ReactNode;
	contents: ReactNode;
	dump: ReactNode;
	image: ReactNode;
};

const DEFAULT_TAB = "news";

export function RootTab({ news, contents, dump, image }: Props) {
	const router = useTransitionRouter();
	const searchParams = useSearchParams();

	const [tab, setTab] = useState(searchParams.get("tab") ?? DEFAULT_TAB);

	const handleTabChange = (value: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("tab", value);
		router.replace(`?${params.toString()}`);
		setTab(value);
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
			defaultValue={DEFAULT_TAB}
			className="mx-auto max-w-5xl sm:px-2"
			value={tab}
			onValueChange={handleTabChange}
		>
			<TabsList className="w-full">
				{Object.entries(TABS).map(([key, value]) => {
					return (
						<TabsTrigger className="w-full" value={key} key={key}>
							{value}
						</TabsTrigger>
					);
				})}
			</TabsList>
			<TabsContent value="news">{news}</TabsContent>
			<TabsContent value="contents">{contents}</TabsContent>
			<TabsContent value="image">{image}</TabsContent>
			<TabsContent value="dump">{dump}</TabsContent>
		</Tabs>
	);
}
