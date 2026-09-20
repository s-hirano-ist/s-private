"use client";
import type {
	sendTestPush,
	subscribeToPush,
	unsubscribeFromPush,
} from "@/application-services/push-notifications/actions";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { SearchCard } from "@/components/common/features/search/search-card";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@s-hirano-ist/s-ui/drawer";

type Props = {
	onOpenChange: (open: boolean) => void;
	open: boolean;
	publicKey: string;
	search: typeof searchContentFromClient;
	sendTestPush: typeof sendTestPush;
	subscribeToPush: typeof subscribeToPush;
	unsubscribeFromPush: typeof unsubscribeFromPush;
};

export function SearchDrawer({
	open,
	onOpenChange,
	...searchCardProps
}: Props) {
	return (
		<Drawer onOpenChange={onOpenChange} open={open}>
			<DrawerContent className="overflow-hidden">
				<DrawerHeader className="sr-only">
					<DrawerTitle>Search</DrawerTitle>
				</DrawerHeader>
				<SearchCard {...searchCardProps} />
			</DrawerContent>
		</Drawer>
	);
}
