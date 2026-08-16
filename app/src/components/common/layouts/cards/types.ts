export type CardStackInitialData<T> = {
	data: T[];
	totalCount: number;
};

export type ImageCardData = {
	authors?: string;
	href: string;
	id: string;
	image: string | null;
	subtitle?: string;
	title: string;
};

export type LinkCardData = {
	description?: string;
	href: string;
	id: string;
	key: string;
	primaryBadgeText?: string;
	secondaryBadgeText?: string;
	title: string;
};

export type ImageCardStackInitialData = CardStackInitialData<ImageCardData>;

export type LinkCardStackInitialData = CardStackInitialData<LinkCardData>;
