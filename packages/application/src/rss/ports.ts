import type {
	EntryInput,
	Feed,
	FeedInput,
	ParsedEntry,
	RssPage,
	RssView,
	SaveResult,
} from "@s-hirano-ist/s-core/rss/types";
export type FeedLease = Feed & {
	etag: string | null;
	lastModified: string | null;
	token: string;
};
export type FeedResult = {
	entries: ParsedEntry[];
	etag: string | null;
	lastModified: string | null;
	notModified: boolean;
	repairMetadata?: boolean;
	title: string;
};
export type RssRepository = {
	claim(owner: string, id: string, force: boolean): Promise<FeedLease | null>;
	complete(
		owner: string,
		lease: FeedLease,
		result: FeedResult,
	): Promise<boolean>;
	due(now: Date, limit: number): Promise<{ id: string; userId: string }[]>;
	fail(owner: string, lease: FeedLease): Promise<void>;
	page(
		owner: string,
		offset: number,
		feedId?: string,
		view?: RssView,
		snapshotRevision?: number,
	): Promise<RssPage>;
	read(
		owner: string,
		input: { feedId?: string; ids?: string[]; snapshotRevision?: number },
	): Promise<void>;
	save(owner: string, input: EntryInput): Promise<SaveResult>;
	saveMany(owner: string, entries: EntryInput[]): Promise<number>;
	subscribe(owner: string, input: FeedInput): Promise<boolean>;
	unsave(owner: string, id: string): Promise<void>;
	unsubscribe(owner: string, id: string): Promise<void>;
};
export type RssFeedReader = (lease: FeedLease) => Promise<FeedResult>;
export type RssImport = {
	feeds: FeedInput[];
	invalid: number;
	saved: EntryInput[];
};
