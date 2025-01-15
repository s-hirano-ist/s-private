"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransitionRouter } from "next-view-transitions";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

const TABS = {
	books: "BOOKS",
	contents: "CONTENTS",
	images: "IMAGES",
};

type Props = {
	books: ReactNode;
	contents: ReactNode;
	images: ReactNode;
};

const DEFAULT_TAB = "books";

export function RootTab({ books, contents, images }: Props) {
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
			<TabsContent value="books"> {books}</TabsContent>
			<TabsContent value="contents"> {contents}</TabsContent>
			<TabsContent value="images"> {images}</TabsContent>
		</Tabs>
	);
}
