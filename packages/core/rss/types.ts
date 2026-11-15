/** RSS keeps unread metadata and independent saved links; no export lifecycle. */
export type FeedInput = { folder: string; title: string; url: string };
export type Feed = FeedInput & {
	error: string | null;
	id: string;
	lastFetchedAt: string | null;
};
export type EntryInput = {
	publishedAt: string | null;
	title: string;
	url: string;
};
export type UnreadEntry = EntryInput & {
	feedId: string;
	id: string;
	receivedAt: string;
};
export type SavedEntry = EntryInput & { id: string; savedAt: string };
export type ParsedEntry = EntryInput & { identity: string };
export type RssPage = {
	feeds: Feed[];
	saved: SavedEntry[];
	savedCount: number;
	unread: UnreadEntry[];
	unreadCount: number;
};
