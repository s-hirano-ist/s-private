"use server";
import "server-only";
import type {
	RssEntryInput,
	RssFeedInput,
	RssReadInput,
} from "@s-hirano-ist/s-api-client/models";
import { getBackendClient } from "@/common/backend/server-client";
export async function loadRss(offset = 0, feedId?: string) {
	return (await (await getBackendClient()).getRssPage({ offset, feedId })).data;
}
export async function subscribeRss(input: RssFeedInput) {
	await (await getBackendClient()).subscribeRss(input);
}
export async function unsubscribeRss(id: string) {
	await (await getBackendClient()).unsubscribeRss(id);
}
export async function markRssRead(input: RssReadInput) {
	await (await getBackendClient()).markRssRead(input);
}
export async function saveRss(input: RssEntryInput) {
	await (await getBackendClient()).saveRss(input);
}
export async function unsaveRss(id: string) {
	await (await getBackendClient()).unsaveRss(id);
}
export async function refreshRss(ids: string[], force: boolean) {
	return (await (await getBackendClient()).refreshRss({ ids, force })).data;
}
export async function importRss(kind: "opml" | "starred", content: string) {
	return (await (await getBackendClient()).importRss({ kind, content })).data;
}
