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
	contents: ReactNode;
	dump: ReactNode;
	image: ReactNode;
	news: ReactNode;
};

const DEFAULT_TAB = "news";

export function RootTab({ news, contents, dump, image }: Props) {
	const router = useTransitionRouter();
	const searchParameters = useSearchParams();

	const [tab, setTab] = useState(searchParameters.get("tab") ?? DEFAULT_TAB);

	const handleTabChange = (value: string) => {
		const parameters = new URLSearchParams(searchParameters);
		parameters.set("tab", value);
		router.replace(`?${parameters.toString()}`);
		setTab(value);
	};

	useEffect(() => {
		const tab = searchParameters.get("tab");
		if (!tab) return;

		const parameters = new URLSearchParams(searchParameters);
		if (!Object.keys(TABS).includes(tab)) {
			parameters.delete("tab");
			router.replace(`?${parameters.toString()}`);
			setTab(DEFAULT_TAB);
		}
	}, [searchParameters, router]);

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
			<TabsContent value="image">{image}</TabsContent>
			<TabsContent value="dump">{dump}</TabsContent>
		</Tabs>
	);
}
