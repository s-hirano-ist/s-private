export const CACHE_INVALIDATION_DOMAINS = [
	"articles",
	"books",
	"images",
	"notes",
] as const;

export type CacheInvalidationDomain =
	(typeof CACHE_INVALIDATION_DOMAINS)[number];

type CacheInvalidationConfig = Readonly<{
	url: string;
	secret: string;
}>;

export async function invalidateContentCache(
	config: CacheInvalidationConfig,
	domain: CacheInvalidationDomain,
	userId: string,
	fetchImplementation: typeof fetch = fetch,
): Promise<void> {
	const response = await fetchImplementation(config.url, {
		method: "POST",
		headers: {
			authorization: `Bearer ${config.secret}`,
			"content-type": "application/json",
		},
		body: JSON.stringify({ domain, userId }),
	});

	if (!response.ok) {
		const responseBody = await response.text();
		throw new Error(
			`Cache invalidation failed (${response.status}): ${responseBody}`,
		);
	}
}
