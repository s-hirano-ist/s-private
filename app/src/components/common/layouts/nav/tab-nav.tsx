"use client";
import { cn } from "@s-hirano-ist/s-ui/utils/cn";
import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";
import { Link } from "@/infrastructures/i18n/routing";

const TABS = {
	articles: "ARTICLES",
	notes: "NOTES",
	images: "IMAGES",
	books: "BOOKS",
} as const;

export function TabNav() {
	const segment = useSelectedLayoutSegment();
	const searchParams = useSearchParams();
	const layout = searchParams.get("layout");

	return (
		<nav className="inline-flex h-10 w-full items-center justify-center border-muted border-b p-1 text-muted-foreground">
			{Object.entries(TABS).map(([key, label]) => {
				const isActive = segment === key;
				const href = layout
					? (`/${key}?layout=${layout}` as const)
					: (`/${key}` as const);

				return (
					<Link
						className={cn(
							"inline-flex w-full items-center justify-center whitespace-nowrap border-transparent border-b-2 px-3 py-2 font-medium text-muted-foreground text-sm transition-all duration-200 hover:text-primary/80",
							isActive && "border-primary font-bold text-primary",
						)}
						href={href}
						key={key}
						replace
					>
						{label}
					</Link>
				);
			})}
		</nav>
	);
}
