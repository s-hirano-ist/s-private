/** RSS keeps unread metadata and independent saved links; no export lifecycle. */
export type FeedInput = { folder: string; title: string; url: string };
export type Feed = FeedInput & {
	error: string | null;
	id: string;
	lastFetchedAt: string | null;
};
export type EntryInput = {
	imageUrl?: string | null;
	publishedAt: string | null;
	title: string;
	url: string;
};
export type UnreadEntry = EntryInput & {
	feedId: string;
	id: string;
	receivedAt: string;
	savedId?: string | null;
};
export type SavedEntry = EntryInput & { id: string; savedAt: string };
export type SaveResult = { added: boolean; saved: SavedEntry };
export type ParsedEntry = EntryInput & { identity: string };
export type RssPage = {
	feeds: Feed[];
	newerCount: number;
	offset: number;
	saved: SavedEntry[];
	savedCount: number;
	snapshotRevision: number;
	unread: UnreadEntry[];
	unreadCount: number;
};

export type RssView = "all" | "unread" | "saved" | "feeds";
