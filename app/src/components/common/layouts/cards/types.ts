export type CardStackInitialData<T> = {
	data: T[];
	totalCount: number;
};

export type ImageCardData = {
	id: string;
	href: string;
	title: string;
	image: string | null;
	subtitle?: string;
	authors?: string;
};

export type LinkCardData = {
	id: string;
	key: string;
	title: string;
	description?: string;
	primaryBadgeText?: string;
	secondaryBadgeText?: string;
	href: string;
};

export type ImageCardStackInitialData = CardStackInitialData<ImageCardData>;

export type LinkCardStackInitialData = CardStackInitialData<LinkCardData>;
