"use client";
import { Link } from "@/infrastructures/i18n/routing";
import { cn } from "@s-hirano-ist/s-ui/utils/cn";
import { useSelectedLayoutSegments } from "next/navigation";

const TABS = {
	articles: "ARTICLES",
	notes: "NOTES",
	images: "IMAGES",
	books: "BOOKS",
} as const;

export function TabNav() {
	const segments = useSelectedLayoutSegments();
	const activeTab = segments[0];
	const isViewer = segments.includes("viewer");

	return (
		<nav className="inline-flex h-10 w-full items-center justify-center border-b border-muted p-1 text-muted-foreground">
			{Object.entries(TABS).map(([key, label]) => {
				const isActive = activeTab === key;
				const href = isViewer
					? (`/${key}/viewer` as const)
					: (`/${key}` as const);

				return (
					<Link
						className={cn(
							"inline-flex w-full items-center justify-center border-b-2 border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all duration-200 hover:text-primary/80",
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
