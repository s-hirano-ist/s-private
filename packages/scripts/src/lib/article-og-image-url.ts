/** Resolve relative OG metadata against the article URL, preserving absolute URLs. */
export function resolveArticleOgImageUrl(
	value: string | null | undefined,
	articleUrl: string,
): string | null {
	if (value === null || value === undefined || value.trim() === "") return null;
	return URL.canParse(value) ? value : new URL(value, articleUrl).href;
}
