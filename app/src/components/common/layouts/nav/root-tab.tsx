"use client";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@s-hirano-ist/s-ui/ui/tabs";
import { cn } from "@s-hirano-ist/s-ui/utils/cn";
import { useRouter, useSearchParams } from "next/navigation";
import {
	memo,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useOptimistic,
	useTransition,
} from "react";

const TABS = {
	articles: "ARTICLES",
	notes: "NOTES",
	images: "IMAGES",
	books: "BOOKS",
} as const;

const TAB_KEYS = new Set(Object.keys(TABS));

type Props = {
	books: ReactNode;
	notes: ReactNode;
	images: ReactNode;
	articles: ReactNode;
};

const DEFAULT_TAB = "articles";

function RootTabComponent({ articles, books, notes, images }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	// Derive tab from searchParams - single source of truth
	const tab = useMemo(() => {
		const param = searchParams.get("tab");
		if (param && TAB_KEYS.has(param)) {
			return param;
		}
		return DEFAULT_TAB;
	}, [searchParams]);

	// Use optimistic for perceived performance
	const [optimisticTab, setOptimisticTab] = useOptimistic(tab);

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
			startTransition(() => {
				setOptimisticTab(value);
				const params = new URLSearchParams(searchParams);
				params.delete("page");
				params.set("tab", value);
				router.replace(`?${params.toString()}`);
			});
		},
		[router, searchParams, setOptimisticTab],
	);

	// Redirect invalid tab values
	useEffect(() => {
		const currentTab = searchParams.get("tab");
		if (currentTab && !TAB_KEYS.has(currentTab)) {
			const params = new URLSearchParams(searchParams);
			params.delete("tab");
			router.replace(`?${params.toString()}`);
		}
	}, [searchParams, router]);

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
			value={optimisticTab}
		>
			{tabsList}
			<TabsContent value="articles">{articles}</TabsContent>
			<TabsContent value="notes">{notes}</TabsContent>
			<TabsContent value="books">{books}</TabsContent>
			<TabsContent value="images">{images}</TabsContent>
		</Tabs>
	);
}

export const RootTab = memo(RootTabComponent);
