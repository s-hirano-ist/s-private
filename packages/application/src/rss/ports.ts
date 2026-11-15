import type {
	EntryInput,
	Feed,
	FeedInput,
	ParsedEntry,
	RssPage,
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
	title: string;
};
export type RssRepository = {
	claim(owner: string, id: string, force: boolean): Promise<FeedLease | null>;
	complete(owner: string, lease: FeedLease, result: FeedResult): Promise<void>;
	fail(owner: string, lease: FeedLease): Promise<void>;
	page(owner: string, offset: number, feedId?: string): Promise<RssPage>;
	read(
		owner: string,
		input: { before?: string; feedId?: string; ids?: string[] },
	): Promise<void>;
	save(owner: string, input: EntryInput): Promise<boolean>;
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
