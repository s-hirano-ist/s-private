export const PAGE_NAME = "s-private";

export const PAGE_SIZE = 24;

// NOTE: sync with s-contents/update-db.ts
export const ORIGINAL_IMAGE_PATH = "images/original";
export const THUMBNAIL_IMAGE_PATH = "images/thumbnail";
export const THUMBNAIL_WIDTH = 192;
export const THUMBNAIL_HEIGHT = 192;

export const NOT_FOUND_IMAGE_PATH = "/not-found.png";

export const SKELETON_STACK_SIZE = 10;

export const UTIL_URLS = [
	{ name: "NEWS", url: "https://s-hirano.com/news" },
	{ name: "SUMMARY", url: "https://s-hirano.com/summary" },
	{ name: "BOOK", url: "https://s-hirano.com/book" },
	{ name: "BLOG", url: "https://s-hirano.com/blog" },
	{ name: "PORTAINER", url: "https://s-tools.s-hirano.com:9443" },
	{ name: "GRAFANA", url: "https://s-tools.s-hirano.com:3001" },
	{ name: "STORYBOOK", url: "https://storybook.private.s-hirano.com" },
	{ name: "ON-PREMISE", url: "https://s-tools.s-hirano.com" },
] as const;
