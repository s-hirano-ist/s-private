import type { ImageCardData } from "@/common/components/card/image-card";
import type { LinkCardData } from "@/common/components/card/link-card";

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
