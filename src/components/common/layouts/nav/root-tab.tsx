"use client";
import { useRouter, useSearchParams } from "next/navigation";
import {
	memo,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/common/ui/tabs";
import { cn } from "@/components/common/utils/cn";

const TABS = {
	articles: "ARTICLES",
	contents: "CONTENTS",
	images: "IMAGES",
	books: "BOOKS",
};

type Props = {
	books: ReactNode;
	contents: ReactNode;
	images: ReactNode;
	articles: ReactNode;
};

const DEFAULT_TAB = "articles";

function RootTabComponent({ articles, books, contents, images }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [tab, setTab] = useState(searchParams.get("tab") ?? DEFAULT_TAB);
	const [isPending, startTransition] = useTransition();

	// Prefetch all tab routes on component mount
	useEffect(() => {
		const currentParams = new URLSearchParams(searchParams);
		Object.keys(TABS).forEach((tabKey) => {
			if (tabKey !== tab) {
				const prefetchParams = new URLSearchParams(currentParams);
				prefetchParams.set("tab", tabKey);
				prefetchParams.delete("page");
				router.prefetch(`?${prefetchParams.toString()}`);
			}
		});
	}, [router, searchParams, tab]);

	const handleTabChange = useCallback(
		(value: string) => {
			// Optimistic UI update
			setTab(value);

			startTransition(() => {
				const params = new URLSearchParams(searchParams);
				params.delete("page");
				params.set("tab", value);
				router.replace(`?${params.toString()}`);
			});
		},
		[router, searchParams],
	);

	useEffect(() => {
		const currentTab = searchParams.get("tab");
		if (!currentTab) return;

		if (!Object.keys(TABS).includes(currentTab)) {
			const params = new URLSearchParams(searchParams);
			params.delete("tab");
			router.replace(`?${params.toString()}`);
			setTab(DEFAULT_TAB);
		} else if (currentTab !== tab) {
			setTab(currentTab);
		}
	}, [searchParams, router, tab]);

	const tabsList = useMemo(
		() => (
			<TabsList className={cn("w-full", isPending && "opacity-50")}>
				{Object.entries(TABS).map(([key, value]) => {
					return (
						<TabsTrigger
							className="w-full"
							disabled={isPending}
							key={key}
							value={key}
						>
							{value}
						</TabsTrigger>
					);
				})}
			</TabsList>
		),
		[isPending],
	);

	return (
		<Tabs
			className="mx-auto max-w-5xl sm:px-2"
			defaultValue={DEFAULT_TAB}
			onValueChange={handleTabChange}
			value={tab}
		>
			{tabsList}
			<TabsContent value="articles">{articles}</TabsContent>
			<TabsContent value="contents">{contents}</TabsContent>
			<TabsContent value="books">{books}</TabsContent>
			<TabsContent value="images">{images}</TabsContent>
		</Tabs>
	);
}

export const RootTab = memo(RootTabComponent);
