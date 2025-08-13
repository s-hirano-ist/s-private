import type { ImageCardData } from "@/components/card/image-card";
import type { LinkCardData } from "@/components/card/link-card";

export function filterImageCards(
	image: ImageCardData,
	searchQuery: string,
): boolean {
	return image.title.includes(searchQuery);
}

export function filterLinkCards(
	item: LinkCardData,
	searchQuery: string,
): boolean {
	return (
		item.title.includes(searchQuery) ||
		(item.description?.includes(searchQuery) ?? false)
	);
}
