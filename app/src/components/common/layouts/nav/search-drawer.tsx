"use client";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@s-hirano-ist/s-ui/ui/drawer";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { SearchCard } from "../../features/search/search-card";

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
