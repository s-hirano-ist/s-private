"use client";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { SearchCard } from "@/components/common/features/search/search-card";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@s-hirano-ist/s-ui/ui/drawer";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	search: typeof searchContentFromClient;
};

export function SearchDrawer({ open, onOpenChange, search }: Props) {
	return (
		<Drawer onOpenChange={onOpenChange} open={open}>
			<DrawerContent className="max-h-[80vh]">
				<DrawerHeader className="sr-only">
					<DrawerTitle>Search</DrawerTitle>
				</DrawerHeader>
				<SearchCard search={search} />
			</DrawerContent>
		</Drawer>
	);
}
